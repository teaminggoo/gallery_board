/**
 * ====================================================================
 * Firebase Configuration & Initialization
 * ====================================================================
 */

const firebaseConfig = {
  apiKey: "AIzaSyDacBv5NiENj5kzB0Ty0w5khwiQkNNzzjg",
  authDomain: "gallery-board-1827a.firebaseapp.com",
  projectId: "gallery-board-1827a",
  storageBucket: "gallery-board-1827a.firebasestorage.app",
  messagingSenderId: "241507196451",
  appId: "1:241507196451:web:172ff11a0bdc4b4acb1b96"
};

// Firebase 앱 및 서비스 초기화
let db = null;
let auth = null;

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    auth = firebase.auth();
    // 한국어 에러 메시지/인증 언어 설정
    auth.useDeviceLanguage();
    console.log("🌸 Firebase Firestore & Authentication이 성공적으로 연결되었습니다.");
  } else {
    console.warn("Firebase SDK가 로드되지 않았습니다.");
  }
} catch (error) {
  console.error("Firebase 초기화 오류:", error);
}
