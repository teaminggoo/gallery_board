/**
 * ====================================================================
 * Komorebi Gallery Board - UI Controller, Cloudinary & Firebase Auth
 * ====================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const galleryGrid = document.getElementById('galleryGrid');
  const postCountEl = document.getElementById('postCount');
  const openCreateBtn = document.getElementById('openCreateBtn');
  const toastContainer = document.getElementById('toastContainer');
  const viewButtons = document.querySelectorAll('.view-btn');
  const userProfileArea = document.getElementById('userProfileArea');

  // Modals
  const detailModal = document.getElementById('detailModal');
  const formModal = document.getElementById('formModal');
  const deleteModal = document.getElementById('deleteModal');
  const authModal = document.getElementById('authModal');

  // Detail Modal Elements
  const detailImage = document.getElementById('detailImage');
  const detailDate = document.getElementById('detailDate');
  const detailAuthor = document.getElementById('detailAuthor');
  const detailImageName = document.getElementById('detailImageName');
  const detailTitle = document.getElementById('detailTitle');
  const detailContent = document.getElementById('detailContent');
  const detailEditBtn = document.getElementById('detailEditBtn');
  const detailDeleteBtn = document.getElementById('detailDeleteBtn');

  // Form Modal Elements
  const postForm = document.getElementById('postForm');
  const editPostId = document.getElementById('editPostId');
  const formModalTitle = document.getElementById('formModalTitle');
  const formModalSubtitle = document.getElementById('formModalSubtitle');
  const postTitle = document.getElementById('postTitle');
  const postContent = document.getElementById('postContent');
  const formSubmitBtn = document.getElementById('formSubmitBtn');
  const selectedImageUrl = document.getElementById('selectedImageUrl');
  const selectedImageTitle = document.getElementById('selectedImageTitle');

  // Cloudinary Image Upload Elements
  const dropZone = document.getElementById('dropZone');
  const imageFileInput = document.getElementById('imageFileInput');
  const dropZonePrompt = document.getElementById('dropZonePrompt');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imageFilePreview = document.getElementById('imageFilePreview');
  const previewFileName = document.getElementById('previewFileName');
  const changeImageBtn = document.getElementById('changeImageBtn');
  const removeImageBtn = document.getElementById('removeImageBtn');

  // Progress Bar Elements
  const uploadProgressContainer = document.getElementById('uploadProgressContainer');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const uploadProgressText = document.getElementById('uploadProgressText');

  // Delete Modal Elements
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // Auth Modal Elements
  const authForm = document.getElementById('authForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const authModalTitle = document.getElementById('authModalTitle');
  const authModalSubtitle = document.getElementById('authModalSubtitle');
  const authNickname = document.getElementById('authNickname');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authErrorMsg = document.getElementById('authErrorMsg');
  const nicknameGroup = document.getElementById('nicknameGroup');

  // State Variables
  let currentUser = null;
  let currentActivePost = null;
  let postPendingDeleteId = null;
  let authMode = 'login'; // 'login' | 'signup'
  let currentSelectedFile = null; // 사용자가 이번에 새로 첨부한 파일 객체
  let isImageRemoved = false; // 수정 모드에서 기존 이미지를 삭제했는지 여부
  const VIEW_STORAGE_KEY = 'komorebi_gallery_view_mode';

  /* ====================================================================
     1. 초기화 & 인증 감지
     ==================================================================== */
  initAuthObserver();
  initViewMode();
  initImageUploadHandlers();
  loadAndRenderPosts();

  function initAuthObserver() {
    if (!auth) {
      console.warn("Firebase Auth 객체가 초기화되지 않았습니다.");
      return;
    }

    auth.onAuthStateChanged((user) => {
      currentUser = user;
      renderUserHeader(user);

      if (currentActivePost) {
        updateDetailButtonsVisibility(currentActivePost);
      }
    });
  }

  function renderUserHeader(user) {
    if (user) {
      const displayName = user.displayName || user.email.split('@')[0];
      const initial = displayName.charAt(0).toUpperCase();

      userProfileArea.innerHTML = `
        <div class="user-badge" title="${escapeHtml(user.email)}">
          <div class="user-avatar-circle">${initial}</div>
          <span class="user-name-text">${escapeHtml(displayName)} 님</span>
        </div>
        <button id="logoutBtn" class="btn btn-secondary btn-sm" type="button" title="로그아웃">
          로그아웃
        </button>
      `;

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
      }
    } else {
      userProfileArea.innerHTML = `
        <button id="openAuthBtn" class="btn btn-secondary btn-sm" type="button">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          로그인
        </button>
      `;

      const openAuthBtn = document.getElementById('openAuthBtn');
      if (openAuthBtn) {
        openAuthBtn.addEventListener('click', () => openAuthModal('login'));
      }
    }
  }

  /* ====================================================================
     2. 이미지 첨부 및 미리보기 핸들러 (Cloudinary 연동용)
     ==================================================================== */
  function initImageUploadHandlers() {
    // 파일 선택 change 이벤트
    imageFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleSelectedFile(file);
    });

    // 드래그 앤 드롭
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleSelectedFile(file);
      } else {
        showToast('이미지 파일(JPG, PNG, GIF, WebP 등)만 첨부할 수 있습니다.');
      }
    });

    // [사진 변경] 버튼
    changeImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageFileInput.click();
    });

    // [사진 삭제] 버튼
    removeImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSelectedImage();
      showToast('첨부된 사진이 삭제되었습니다. (기본 커버 적용)');
    });
  }

  // 사용자가 파일을 선택했을 때 즉각적인 로컬 미리보기 생성
  function handleSelectedFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 선택해주세요.');
      return;
    }

    currentSelectedFile = file;
    isImageRemoved = false;

    const reader = new FileReader();
    reader.onload = (e) => {
      imageFilePreview.src = e.target.result;
      const sizeKb = Math.round(file.size / 1024);
      previewFileName.textContent = `${file.name} (${sizeKb} KB)`;

      dropZonePrompt.style.display = 'none';
      imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  function clearSelectedImage() {
    currentSelectedFile = null;
    isImageRemoved = true;
    imageFileInput.value = '';
    selectedImageUrl.value = '';
    selectedImageTitle.value = '';
    resetImagePreviewUI();
  }

  function resetImagePreviewUI() {
    imageFileInput.value = '';
    imageFilePreview.src = '';
    previewFileName.textContent = '';
    dropZonePrompt.style.display = 'block';
    imagePreviewContainer.style.display = 'none';
    hideProgressBar();
  }

  function showProgressBar() {
    uploadProgressContainer.style.display = 'block';
    uploadProgressBar.style.width = '0%';
    uploadProgressText.textContent = 'Cloudinary에 사진을 업로드하고 있습니다... 0%';
  }

  function updateProgressBar(percent) {
    uploadProgressBar.style.width = percent + '%';
    uploadProgressText.textContent = `Cloudinary에 사진을 업로드하고 있습니다... ${percent}%`;
  }

  function hideProgressBar() {
    uploadProgressContainer.style.display = 'none';
    uploadProgressBar.style.width = '0%';
  }

  /* ====================================================================
     3. 뷰 모드 스위처 (4열 / 3열 / 매거진 피드)
     ==================================================================== */
  function initViewMode() {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY) || 'grid-4';
    applyViewMode(savedView);

    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewType = btn.dataset.view;
        applyViewMode(viewType);
        localStorage.setItem(VIEW_STORAGE_KEY, viewType);
      });
    });
  }

  function applyViewMode(viewType) {
    viewButtons.forEach(b => {
      if (b.dataset.view === viewType) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    galleryGrid.classList.remove('view-grid-4', 'view-grid-3', 'view-list-feed');
    if (viewType === 'grid-3') {
      galleryGrid.classList.add('view-grid-3');
    } else if (viewType === 'list-feed') {
      galleryGrid.classList.add('view-list-feed');
    } else {
      galleryGrid.classList.add('view-grid-4');
    }
  }

  /* ====================================================================
     4. 게시글 목록 불러오기 & 렌더링
     ==================================================================== */
  async function loadAndRenderPosts() {
    galleryGrid.innerHTML = `
      <li class="empty-gallery">
        <div class="empty-gallery-icon">⏳</div>
        <h3>기록을 불러오는 중입니다...</h3>
        <p>Firebase Firestore 클라우드 저장소와 통신하고 있습니다.</p>
      </li>
    `;

    try {
      let posts = await DataService.getPosts();

      // [자동 정리] 기존 생성된 샘플 글이 여러 개 남아있을 경우 1개만 남기고 자동 정리
      const samplePosts = posts.filter(p => !p.authorId || p.authorName === '코모레비 갤러리');
      if (samplePosts.length > 1) {
        try {
          await DataService.keepOnlyOnePost();
          posts = await DataService.getPosts();
        } catch (cleanErr) {
          console.warn("자동 정리 건너뜀 (권한 필요):", cleanErr);
        }
      }

      postCountEl.textContent = posts.length;

      if (!posts || posts.length === 0) {
        galleryGrid.innerHTML = `
          <li class="empty-gallery">
            <div class="empty-gallery-icon">❖</div>
            <h3>아직 등록된 기록이 없습니다</h3>
            <p>상단의 '새 글 쓰기'를 눌러 일상의 순간을 남겨보세요.</p>
            <button class="btn btn-secondary btn-sm" id="resetSampleBtn" type="button">
              기본 샘플 데이터 복원하기
            </button>
          </li>
        `;
        const resetBtn = document.getElementById('resetSampleBtn');
        if (resetBtn) {
          resetBtn.addEventListener('click', async () => {
            await DataService.resetToInitial();
            showToast('샘플 데이터를 복원했습니다.');
            loadAndRenderPosts();
          });
        }
        return;
      }

      galleryGrid.innerHTML = posts.map(post => {
        const authorText = post.authorName || '익명';
        const displayImage = post.imageUrl || (typeof DEFAULT_POST_COVER !== 'undefined' ? DEFAULT_POST_COVER : IMAGE_FALLBACK_URL);

        return `
          <li class="post-card" data-id="${post.id}" tabindex="0" role="article" aria-label="${escapeHtml(post.title)}">
            <div class="card-thumbnail-wrap">
              <img 
                class="card-thumbnail" 
                src="${displayImage}" 
                alt="${escapeHtml(post.title)}" 
                loading="lazy"
                onerror="this.onerror=null; this.src='${IMAGE_FALLBACK_URL}';"
              >
              <span class="card-tag">기록</span>
            </div>
            <div class="card-body">
              <div class="card-date">
                <svg class="card-date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${post.createdAt}</span>
              </div>
              <h3 class="card-title">${escapeHtml(post.title)}</h3>
              <p class="card-snippet">${escapeHtml(post.content)}</p>
              <div class="card-footer">
                <span class="card-author-tag">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  ${escapeHtml(authorText)}
                </span>
                <span class="view-more-link">
                  자세히 읽기
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </span>
              </div>
            </div>
          </li>
        `;
      }).join('');

      document.querySelectorAll('.post-card').forEach(card => {
        const id = card.dataset.id;
        card.addEventListener('click', () => openDetailModal(id));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') openDetailModal(id);
        });
      });

    } catch (err) {
      console.error('게시글 렌더링 실패:', err);
      let errorMsg = '게시글을 불러오지 못했습니다.';
      let subMsg = '인터넷 연결 상태 및 Firebase 설정을 확인해주세요.';

      if (err.code === 'permission-denied') {
        errorMsg = 'Firestore 접근 권한이 필요합니다.';
        subMsg = 'Firebase 콘솔의 Firestore 보안 규칙에서 읽기를 허용해주세요.';
      }

      galleryGrid.innerHTML = `
        <li class="empty-gallery">
          <div class="empty-gallery-icon">⚠️</div>
          <h3>${errorMsg}</h3>
          <p>${subMsg}</p>
          <button class="btn btn-secondary btn-sm" onclick="location.reload()" type="button">
            다시 시도
          </button>
        </li>
      `;
      showToast(errorMsg);
    }
  }

  /* ====================================================================
     5. 상세 보기 모달 & 작성자 권한 판별
     ==================================================================== */
  async function openDetailModal(id) {
    try {
      const post = await DataService.getPostById(id);
      if (!post) {
        showToast('게시글을 찾을 수 없습니다.');
        return;
      }

      currentActivePost = post;
      const displayImage = post.imageUrl || (typeof DEFAULT_POST_COVER !== 'undefined' ? DEFAULT_POST_COVER : IMAGE_FALLBACK_URL);

      detailImage.onerror = () => { detailImage.src = IMAGE_FALLBACK_URL; };
      detailImage.src = displayImage;
      detailImage.alt = post.title;
      detailDate.textContent = `기록일: ${post.createdAt}`;
      detailAuthor.innerHTML = `작성자: <strong>${escapeHtml(post.authorName || '익명')}</strong>`;
      detailImageName.textContent = post.imageTitle || (post.imageUrl ? '첨부된 사진' : '기본 감성 커버');
      detailTitle.textContent = post.title;
      detailContent.textContent = post.content;

      updateDetailButtonsVisibility(post);

      openModal(detailModal);
    } catch (err) {
      console.error('상세보기 조회 실패:', err);
      showToast('상세 내용을 불러오지 못했습니다.');
    }
  }

  function updateDetailButtonsVisibility(post) {
    const isOwner = currentUser && (currentUser.uid === post.authorId || !post.authorId);

    if (isOwner) {
      detailEditBtn.style.display = 'inline-flex';
      detailDeleteBtn.style.display = 'inline-flex';
    } else {
      detailEditBtn.style.display = 'none';
      detailDeleteBtn.style.display = 'none';
    }
  }

  detailEditBtn.addEventListener('click', () => {
    if (!currentActivePost) return;
    const targetId = currentActivePost.id;
    closeModal(detailModal);
    openEditModal(targetId);
  });

  detailDeleteBtn.addEventListener('click', () => {
    if (!currentActivePost) return;
    const targetId = currentActivePost.id;
    closeModal(detailModal);
    openDeleteConfirmModal(targetId);
  });

  /* ====================================================================
     6. 글 작성 / 수정 모달 로직 (Cloudinary 업로드 연동)
     ==================================================================== */
  openCreateBtn.addEventListener('click', () => {
    if (!currentUser) {
      showToast('이야기를 작성하려면 먼저 로그인해주세요.');
      openAuthModal('login');
      return;
    }
    openCreateModal();
  });

  function openCreateModal() {
    postForm.reset();
    editPostId.value = '';
    formModalTitle.textContent = '새 이야기 쓰기';
    formModalSubtitle.textContent = '소중한 순간 남기기';
    formSubmitBtn.textContent = '등록하기';

    currentSelectedFile = null;
    isImageRemoved = false;
    selectedImageUrl.value = '';
    selectedImageTitle.value = '';
    resetImagePreviewUI();

    openModal(formModal);
    postTitle.focus();
  }

  async function openEditModal(id) {
    if (!currentUser) {
      showToast('로그인이 필요합니다.');
      openAuthModal('login');
      return;
    }

    try {
      const post = await DataService.getPostById(id);
      if (!post) {
        showToast('게시글을 찾을 수 없습니다.');
        return;
      }

      if (post.authorId && post.authorId !== currentUser.uid) {
        showToast('본인이 작성한 글만 수정할 수 있습니다.');
        return;
      }

      editPostId.value = post.id;
      postTitle.value = post.title;
      postContent.value = post.content;

      formModalTitle.textContent = '이야기 수정';
      formModalSubtitle.textContent = '내용 다듬기';
      formSubmitBtn.textContent = '수정 완료';

      currentSelectedFile = null;
      isImageRemoved = false;
      hideProgressBar();

      // 기존 이미지가 있는 경우 미리보기 표시
      if (post.imageUrl && post.imageUrl !== (typeof DEFAULT_POST_COVER !== 'undefined' ? DEFAULT_POST_COVER : '')) {
        selectedImageUrl.value = post.imageUrl;
        selectedImageTitle.value = post.imageTitle || '기존 등록된 사진';
        imageFilePreview.src = post.imageUrl;
        previewFileName.textContent = post.imageTitle || '등록된 대표 사진';
        dropZonePrompt.style.display = 'none';
        imagePreviewContainer.style.display = 'block';
      } else {
        selectedImageUrl.value = '';
        selectedImageTitle.value = '';
        resetImagePreviewUI();
      }

      openModal(formModal);
      postTitle.focus();
    } catch (err) {
      console.error('수정 모달 로드 실패:', err);
    }
  }

  // 글 작성/수정 폼 제출 핸들러 (Cloudinary 비동기 업로드 진행)
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
      showToast('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
      openAuthModal('login');
      return;
    }

    const title = postTitle.value.trim();
    const content = postContent.value.trim();
    const id = editPostId.value;

    if (!title || !content) {
      showToast('제목과 내용을 모두 입력해주세요.');
      return;
    }

    formSubmitBtn.disabled = true;

    try {
      let finalImageUrl = selectedImageUrl.value;
      let finalImageTitle = selectedImageTitle.value;

      // [1] 새로운 이미지 파일이 선택된 경우 ➔ Cloudinary에 업로드
      if (currentSelectedFile) {
        showProgressBar();
        try {
          finalImageUrl = await uploadImageToCloudinary(currentSelectedFile, (percent) => {
            updateProgressBar(percent);
          });
          finalImageTitle = currentSelectedFile.name;
        } catch (uploadError) {
          console.error("Cloudinary 업로드 실패:", uploadError);
          hideProgressBar();
          showToast(uploadError.message || 'Cloudinary 이미지 업로드에 실패했습니다.');
          formSubmitBtn.disabled = false;
          return;
        }
        hideProgressBar();
      } else if (isImageRemoved) {
        // [2] 사용자가 사진 삭제 버튼을 누른 경우
        finalImageUrl = '';
        finalImageTitle = '';
      }

      // [3] Firestore에 게시글 저장 또는 수정
      if (id) {
        await DataService.updatePost(id, {
          title,
          content,
          imageUrl: finalImageUrl,
          imageTitle: finalImageTitle
        }, currentUser);
        showToast('이야기가 성공적으로 수정되었습니다.');
      } else {
        await DataService.createPost({
          title,
          content,
          imageUrl: finalImageUrl,
          imageTitle: finalImageTitle
        }, currentUser);
        showToast('새로운 이야기가 등록되었습니다.');
      }

      closeModal(formModal);
      await loadAndRenderPosts();
    } catch (err) {
      console.error('게시글 저장 실패:', err);
      showToast(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      formSubmitBtn.disabled = false;
      hideProgressBar();
    }
  });

  /* ====================================================================
     7. 삭제 확인 모달
     ==================================================================== */
  function openDeleteConfirmModal(id) {
    if (!currentUser) {
      showToast('로그인이 필요합니다.');
      openAuthModal('login');
      return;
    }
    postPendingDeleteId = id;
    openModal(deleteModal);
  }

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!postPendingDeleteId || !currentUser) return;

    confirmDeleteBtn.disabled = true;
    try {
      await DataService.deletePost(postPendingDeleteId, currentUser);
      showToast('이야기가 삭제되었습니다.');
      closeModal(deleteModal);
      postPendingDeleteId = null;
      await loadAndRenderPosts();
    } catch (err) {
      console.error('삭제 실패:', err);
      showToast(err.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      confirmDeleteBtn.disabled = false;
    }
  });

  /* ====================================================================
     8. 로그인 / 회원가입 모달 로직
     ==================================================================== */
  function openAuthModal(mode = 'login') {
    authMode = mode;
    switchAuthTab(mode);
    authForm.reset();
    hideAuthError();
    openModal(authModal);
  }

  tabLogin.addEventListener('click', () => switchAuthTab('login'));
  tabSignup.addEventListener('click', () => switchAuthTab('signup'));

  function switchAuthTab(mode) {
    authMode = mode;
    hideAuthError();
    if (mode === 'login') {
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
      authModalTitle.textContent = '로그인';
      authModalSubtitle.textContent = '기억의 서재';
      nicknameGroup.style.display = 'none';
      authNickname.required = false;
      authSubmitBtn.textContent = '로그인';
    } else {
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
      authModalTitle.textContent = '회원가입';
      authModalSubtitle.textContent = '새로운 인연';
      nicknameGroup.style.display = 'block';
      authNickname.required = true;
      authSubmitBtn.textContent = '가입하기';
    }
  }

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthError();

    const email = authEmail.value.trim();
    const password = authPassword.value;
    const nickname = authNickname.value.trim();

    if (!email || !password) {
      showAuthError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    authSubmitBtn.disabled = true;

    try {
      if (authMode === 'signup') {
        if (!nickname) {
          showAuthError('게시글에 표시될 닉네임을 입력해주세요.');
          authSubmitBtn.disabled = false;
          return;
        }

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
          displayName: nickname
        });

        showToast(`${nickname} 님, 환영합니다! 회원가입이 완료되었습니다.`);
        closeModal(authModal);
      } else {
        await auth.signInWithEmailAndPassword(email, password);
        const name = auth.currentUser.displayName || email.split('@')[0];
        showToast(`${name} 님, 반갑습니다.`);
        closeModal(authModal);
      }
    } catch (error) {
      console.error("인증 실패:", error);
      showAuthError(getFriendlyAuthErrorMessage(error.code));
    } finally {
      authSubmitBtn.disabled = false;
    }
  });

  async function handleLogout() {
    try {
      await auth.signOut();
      showToast('로그아웃되었습니다.');
    } catch (error) {
      console.error("로그아웃 실패:", error);
      showToast('로그아웃 중 오류가 발생했습니다.');
    }
  }

  function showAuthError(msg) {
    authErrorMsg.textContent = msg;
    authErrorMsg.style.display = 'block';
  }

  function hideAuthError() {
    authErrorMsg.textContent = '';
    authErrorMsg.style.display = 'none';
  }

  function getFriendlyAuthErrorMessage(code) {
    switch (code) {
      case 'auth/invalid-email':
        return '올바른 이메일 형식이 아닙니다.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return '이메일 또는 비밀번호가 일치하지 않습니다.';
      case 'auth/email-already-in-use':
        return '이미 사용 중인 이메일 주소입니다.';
      case 'auth/weak-password':
        return '비밀번호는 최소 6자 이상이어야 합니다.';
      case 'auth/too-many-requests':
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      case 'auth/operation-not-allowed':
        return 'Firebase 콘솔에서 이메일/비밀번호 로그인이 활성화되지 않았습니다.';
      default:
        return '인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
    }
  }

  /* ====================================================================
     9. 모달 공통 제어 유틸리티
     ==================================================================== */
  function openModal(modalEl) {
    modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('active');
    const remainingActive = document.querySelectorAll('.modal-overlay.active');
    if (remainingActive.length === 0) {
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      const target = document.getElementById(modalId);
      if (target) closeModal(target);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay);
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        closeModal(activeModal);
      }
    }
  });

  /* ====================================================================
     10. 토스트 알림 및 XSS 이스케이프 유틸리티
     ==================================================================== */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B83A2E" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
