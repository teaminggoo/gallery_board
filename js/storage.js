/**
 * ====================================================================
 * Data Storage Service Layer (Firebase Firestore 연동)
 * ====================================================================
 * 기존 LocalStorage 대신 클라우드 데이터베이스인 Firebase Firestore를 사용합니다.
 * 모든 사용자가 실시간으로 공유된 동일한 게시글을 확인하고 관리할 수 있습니다.
 */

const COLLECTION_NAME = 'posts';

class FirestoreAdapter {
  constructor() {
    this.collectionName = COLLECTION_NAME;
  }

  get collection() {
    if (!db) {
      throw new Error("Firebase Firestore가 초기화되지 않았습니다. 인터넷 연결 및 Firebase 설정을 확인해주세요.");
    }
    return db.collection(this.collectionName);
  }

  /**
   * 전체 게시글 목록 조회 (최신 작성일 기준 내림차순 정렬)
   * @returns {Promise<Array>}
   */
  async getPosts() {
    try {
      // 작성일(createdAt) 기준 내림차순 정렬
      const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
      
      // 만약 Firestore에 게시글이 하나도 없다면, 첫 방문 사용자를 위해 초기 샘플 데이터를 자동 시딩
      if (snapshot.empty) {
        console.log("Firestore 컬렉션이 비어 있어 기본 샘플 데이터를 생성합니다...");
        await this.resetToInitial();
        const newSnapshot = await this.collection.orderBy('createdAt', 'desc').get();
        return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Firestore getPosts 실패:", error);
      // 인덱스 문제 등으로 orderBy가 실패할 경우 기본 get() 후 클라이언트 정렬 시도
      try {
        const fallbackSnapshot = await this.collection.get();
        const posts = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return posts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      } catch (fallbackError) {
        console.error("Firestore 전체 조회 실패:", fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * 특정 ID의 게시글 상세 조회
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async getPostById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Firestore getPostById (${id}) 실패:`, error);
      throw error;
    }
  }

  /**
   * 새 게시글 등록 (로그인된 사용자의 UID 및 정보 저장)
   * @param {Object} postData { title, content, imageUrl, imageTitle }
   * @param {Object} currentUser Firebase Auth의 현재 사용자 객체
   * @returns {Promise<Object>}
   */
  async createPost(postData, currentUser) {
    if (!currentUser) {
      throw new Error("게시글을 작성하려면 로그인이 필요합니다.");
    }

    try {
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 닉네임 우선, 없을 시 이메일 아이디 사용
      const displayName = currentUser.displayName || currentUser.email.split('@')[0];

      const newPost = {
        title: postData.title.trim(),
        content: postData.content.trim(),
        imageUrl: postData.imageUrl || (typeof DEFAULT_POST_COVER !== 'undefined' ? DEFAULT_POST_COVER : ''),
        imageTitle: postData.imageTitle || (postData.imageUrl ? '첨부된 사진' : '기본 감성 커버'),
        createdAt: formattedDate,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        // [Firebase Authentication 정보 저장]
        authorId: currentUser.uid,
        authorName: displayName,
        authorEmail: currentUser.email
      };

      const docRef = await this.collection.add(newPost);
      return { id: docRef.id, ...newPost };
    } catch (error) {
      console.error("Firestore createPost 실패:", error);
      throw error;
    }
  }

  /**
   * 게시글 수정 (작성자 본인 검증)
   * @param {string} id 
   * @param {Object} updateData { title, content, imageUrl, imageTitle }
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async updatePost(id, updateData, currentUser) {
    if (!currentUser) {
      throw new Error("로그인한 사용자만 수정할 수 있습니다.");
    }

    try {
      // 기존 문서 조회하여 작성자 권한 체크
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        throw new Error("수정할 게시글을 찾을 수 없습니다.");
      }

      const existingData = doc.data();
      // 작성자가 지정되어 있는 글인 경우, 현재 사용자와 일치해야 함
      if (existingData.authorId && existingData.authorId !== currentUser.uid) {
        throw new Error("본인이 작성한 게시글만 수정할 수 있습니다.");
      }

      const finalImageUrl = (updateData.imageUrl !== undefined) 
        ? (updateData.imageUrl || (typeof DEFAULT_POST_COVER !== 'undefined' ? DEFAULT_POST_COVER : ''))
        : existingData.imageUrl;

      const docRef = this.collection.doc(id);
      const updatePayload = {
        title: updateData.title.trim(),
        content: updateData.content.trim(),
        imageUrl: finalImageUrl,
        imageTitle: updateData.imageTitle || (finalImageUrl ? '첨부된 사진' : '기본 감성 커버'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await docRef.update(updatePayload);
      return { id, ...updatePayload };
    } catch (error) {
      console.error(`Firestore updatePost (${id}) 실패:`, error);
      throw error;
    }
  }

  /**
   * 게시글 삭제 (작성자 본인 검증)
   * @param {string} id 
   * @param {Object} currentUser
   * @returns {Promise<boolean>}
   */
  async deletePost(id, currentUser) {
    if (!currentUser) {
      throw new Error("로그인한 사용자만 삭제할 수 있습니다.");
    }

    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        return true;
      }

      const existingData = doc.data();
      if (existingData.authorId && existingData.authorId !== currentUser.uid) {
        throw new Error("본인이 작성한 게시글만 삭제할 수 있습니다.");
      }

      await this.collection.doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Firestore deletePost (${id}) 실패:`, error);
      throw error;
    }
  }

  /**
   * 기존 샘플 글 중 대표 1개만 남기고 나머지 일괄 삭제 (Batch Delete)
   */
  async keepOnlyOnePost() {
    try {
      const snapshot = await this.collection.get();
      if (snapshot.docs.length <= 1) return 0;

      const batch = db.batch();
      let deleteCount = 0;
      let keptFirst = false;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        // 대표 샘플 글("교토 기온 거리의 오후 산책")이거나 첫 번째 만난 샘플 글을 하나만 유지
        if (!keptFirst && (data.title.includes('교토') || !data.authorId)) {
          keptFirst = true; // 이 글은 남김
        } else {
          // 나머지 이전 샘플 글들은 삭제
          batch.delete(doc.ref);
          deleteCount++;
        }
      });

      if (deleteCount > 0) {
        await batch.commit();
        console.log(`기존 글 정리 완료: ${deleteCount}개 삭제`);
      }
      return deleteCount;
    } catch (error) {
      console.error("keepOnlyOnePost 실패:", error);
      throw error;
    }
  }

  /**
   * 초기 샘플 데이터로 Firestore 일괄 등록 (Batch Write)
   */
  async resetToInitial() {
    try {
      const batch = db.batch();

      INITIAL_POSTS.forEach((post) => {
        // 커스텀 ID 또는 새 문서 생성
        const docRef = this.collection.doc();
        batch.set(docRef, {
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl,
          imageTitle: post.imageTitle,
          createdAt: post.createdAt,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          authorId: null,
          authorName: '코모레비 갤러리'
        });
      });

      await batch.commit();
      console.log("기본 샘플 데이터 시딩 완료");
      return true;
    } catch (error) {
      console.error("Firestore 샘플 데이터 시딩 실패:", error);
      throw error;
    }
  }
}

// 전역 싱글톤 DataService 인스턴스 (Firestore 어댑터 활성화)
const DataService = new FirestoreAdapter();
