# 코모레비 (Komorebi) 감성 갤러리 게시판

나뭇잎 사이로 비치는 햇살처럼, 고즈넉하고 따뜻한 감성을 담은 **한국 사용자 맞춤 반응형 갤러리형 온라인 게시판 웹 애플리케이션**입니다.

---

## 🌸 주요 특징 및 디자인 컨셉
- **차분하고 정갈한 모던 젠(Modern Zen) 감성**:
  - 은은한 미색 한지 느낌 배경과 단정한 먹색 텍스트
  - 붉은 낙관 도장(`빛`) 아이콘 및 단아한 한국어 명조 폰트(`Noto Serif KR`, `Noto Sans KR`)
  - 여백의 미와 카드 호버 시의 은은한 인터랙션
- **모든 UI 텍스트 한국어 지원**:
  - 헤더, 히어로 소개글, 카드 태그, 상세 보기, 글 작성/수정/삭제 모달, 토스트 알림 등 전체 문구를 자연스러운 한국어로 제공
- **갤러리 중심 레이아웃**:
  - 썸네일 이미지가 중심이 되는 시각적 카드 구성
  - **PC 환경**: 정갈한 **3열 그리드 (3 Columns)** 배치
  - **태블릿**: 2열 그리드 배치
  - **모바일**: 화면 크기에 자연스럽게 맞춘 1열 카드 배치

---

## 🛠 구현 기능 안내
1. **게시글 목록 표시 (Gallery Cards)**
   - 썸네일 이미지, 작성일, 작성자 정보, 제목, 본문 2줄 요약 표시
   - **보기 방식 전환**: [4열 갤러리], [3열 와이드], [매거진 목록] 스위처 제공
   - 카드 클릭 시 상세 보기 모달 오픈
2. **게시글 상세 보기 (Detail Modal)**
   - 업로드된 고화질 이미지, 작성일시, 작성자 닉네임, 줄바꿈 유지 본문
   - 본인이 작성한 글에만 [수정] 및 [삭제] 버튼 노출
3. **게시글 작성 및 수정 (CRUD Form Modal)**
   - 글 제목, 본문 작성
   - **Cloudinary 이미지 실제 업로드**:
     - 내 컴퓨터에서 사진 파일 직접 선택 또는 드래그 앤 드롭
     - 즉각적인 파일 미리보기, 사진 변경 및 삭제 버튼 제공
     - 실시간 업로드 프로그레스 바(0% ~ 100%) 및 상태 메시지 안내
     - **선택 사항**: 사진을 첨부하지 않아도 글 작성이 가능하며 정갈한 기본 감성 커버가 자동 적용됩니다.
4. **게시글 삭제 (Delete Confirm Dialog)**
   - 본인 작성 글에 대한 안전한 삭제 확인 모달
5. **Firebase Authentication & Firestore 연동**
   - 이메일/비밀번호 회원가입 & 로그인
   - Cloudinary 이미지 URL(`secure_url`) 및 작성자 `uid`를 Firestore에 실시간 영구 저장

---

## ☁️ Cloudinary 이미지 업로드 연동 정보
- **Cloud Name**: `a3albjef`
- **Upload Preset**: `gallery_board` (Unsigned)
- **저장 방식**: 글 작성/수정 완료 시 Cloudinary 클라우드 스토리지로 직접 업로드되고, 반환된 안전한 HTTPS URL(`secure_url`)이 Firestore `posts` 컬렉션의 `imageUrl` 필드에 영구 저장됩니다.

## 🌐 Firebase Firestore 클라우드 데이터베이스 연동 완료

본 프로젝트는 현재 **Firebase Firestore 클라우드 데이터베이스(`gallery-board-1827a`)**와 실시간으로 연동되어 있습니다.
- 모든 사용자가 동일한 온라인 게시글 목록을 공유하고 조회할 수 있습니다.
- 새 글 등록, 수정, 삭제 작업이 Firestore의 `posts` 컬렉션에 즉시 반영됩니다.

---

## 🔑 Firebase Authentication (회원가입 / 로그인) 연동 완료

본 프로젝트는 **Firebase Authentication (이메일/비밀번호)**과 완벽히 연동되어 있습니다:
- **누구나 조회 가능**: 로그인하지 않아도 모든 갤러리 게시글 목록과 상세 내용을 자유롭게 열람할 수 있습니다.
- **로그인 사용자만 작성 가능**: 상단 우측 '새 글 쓰기'를 클릭하면 비로그인 사용자는 로그인/회원가입 모달로 자연스럽게 안내됩니다.
- **작성자 정보 기록**: 회원의 `uid`, `displayName`(닉네임), `email`이 Firestore 문서에 함께 보관되며 카드 및 상세 모달에 표시됩니다.
- **본인 게시글만 수정/삭제**: 현재 로그인한 사용자의 `uid`와 게시글의 `authorId`가 일치할 때만 상세 모달에서 [수정] 및 [삭제] 버튼이 표시되며 실행할 수 있습니다.

---

## ⚙️ Firebase Console 필수 설정 안내

게시판의 회원가입과 로그인이 정상 작동하려면 Firebase 콘솔에서 **이메일/비밀번호 로그인 제공업체를 활성화**해야 합니다.

1. **[Firebase Console](https://console.firebase.google.com/) 접속** ➔ 프로젝트(`gallery-board-1827a`) 선택
2. 좌측 메뉴에서 **빌드(Build)** ➔ **Authentication** 클릭
3. 처음 접속 시 **[시작하기(Get started)]** 버튼 클릭
4. **Sign-in method(로그인 방법)** 탭 선택 ➔ **이메일/비밀번호(Email/Password)** 선택
5. 첫 번째 스위치인 **`이메일/비밀번호` 사용 설정(Enable)**을 켜고 **[저장(Save)]** 클릭
   *(이메일 링크(비밀번호 없는 로그인)는 비활성 상태로 두시면 됩니다)*

---

## 🔒 최종 Firestore 보안 규칙 (Security Rules) 설정

Firebase Console ➔ **Firestore Database** ➔ **규칙(Rules)** 탭에 아래의 보안 규칙을 적용(게시)해주세요.
사용자의 `request.auth.uid`를 검증하여 **타인이 다른 사람의 게시글을 임의로 수정하거나 삭제하는 것을 데이터베이스 레벨에서 원천 차단**합니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      // 1. 읽기: 로그인 여부와 관계없이 누구나 가능
      allow read: if true;
      
      // 2. 글 작성: 로그인한 사용자만 가능하며, 본인의 uid를 authorId로 지정해야 함
      allow create: if request.auth != null 
                    && request.resource.data.authorId == request.auth.uid;
                    
      // 3. 수정 및 삭제: 글을 작성한 본인(authorId 일치)만 가능
      // (단, authorId가 없는 초기 샘플 글은 누구나 정리/삭제 가능)
      allow update, delete: if (resource.data.authorId == null || !('authorId' in resource.data))
                            || (request.auth != null && resource.data.authorId == request.auth.uid);
    }
  }
}
```

### 2단계: Firebase Authentication 연동
- 사용자가 로그인했을 때의 `currentUser.uid`, `currentUser.displayName`을 게시글 작성 시 `authorId`, `authorName`으로 함께 저장하도록 필드가 준비되어 있습니다.
- 상세 보기 모달에서 현재 로그인한 사용자와 `post.authorId`가 일치할 때만 수정/삭제 버튼을 활성화할 수 있습니다.

### 3단계: Cloudinary 이미지 업로드 연동
- 작성 모달의 썸네일 선택 영역에 `<input type="file" accept="image/*">`를 추가하고, 선택된 이미지 파일을 Cloudinary Upload API(`https://api.cloudinary.com/v1_1/<cloud_name>/image/upload`)로 전송합니다.
- 반환받은 `secure_url`을 `selectedImageUrl.value`에 주입하면 기존 저장 로직과 완벽히 호환됩니다.

---

## 💻 실행 방법
- 별도의 빌드나 설치 과정 없이 [index.html](file:///d:/00_공부/02_바이브코딩/gallery_board/index.html) 파일을 브라우저로 더블 클릭하여 바로 실행할 수 있습니다.
