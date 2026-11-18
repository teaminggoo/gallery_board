/**
 * ====================================================================
 * Cloudinary Image Upload Service
 * ====================================================================
 * Cloud Name: a3albjef
 * Upload Preset: gallery_board (Unsigned)
 */

const CLOUDINARY_CONFIG = {
  cloudName: 'a3albjef',
  uploadPreset: 'gallery_board'
};

// 이미지를 첨부하지 않았을 때 사용할 기본 감성 커버 이미지 (정갈한 일본풍 서재/풍경 일러스트 SVG)
const DEFAULT_POST_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500' width='100%25' height='100%25'%3E%3Cdefs%3E%3ClinearGradient id='bgGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23F4EFE6'/%3E%3Cstop offset='100%25' stop-color='%23E9E2D5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bgGrad)'/%3E%3Ccircle cx='400' cy='220' r='90' fill='%23FAF8F5' opacity='0.7'/%3E%3Ccircle cx='400' cy='220' r='55' fill='%23B83A2E' opacity='0.12'/%3E%3Cpath d='M350 250 L400 180 L450 250 Z' fill='%239C978F' opacity='0.45'/%3E%3Cpath d='M380 250 L420 195 L460 250 Z' fill='%236B6862' opacity='0.35'/%3E%3Ctext x='400' y='330' font-family='serif' font-size='20' fill='%235A5854' text-anchor='middle' letter-spacing='3'%3E木漏れ日 — 코모레비%3C/text%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='13' fill='%239C978F' text-anchor='middle' letter-spacing='1'%3E사색과 일상의 기록%3C/text%3E%3C/svg%3E";

/**
 * Cloudinary에 단일 이미지 파일을 비동기로 업로드합니다.
 * @param {File} file 업로드할 파일 객체
 * @param {Function} [onProgress] 진행률 콜백 (0 ~ 100)
 * @returns {Promise<string>} 업로드된 이미지의 secure_url
 */
async function uploadImageToCloudinary(file, onProgress) {
  if (!file) {
    throw new Error("업로드할 파일이 선택되지 않았습니다.");
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    // 진행률 추적
    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.secure_url) {
            resolve(res.secure_url);
          } else {
            reject(new Error("Cloudinary에서 반환된 이미지 URL이 없습니다."));
          }
        } catch (e) {
          reject(new Error("Cloudinary 응답 데이터 해석 실패"));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          const msg = errRes.error?.message || `업로드 실패 (HTTP ${xhr.status})`;
          reject(new Error(`Cloudinary 오류: ${msg}`));
        } catch (e) {
          reject(new Error(`이미지 업로드에 실패했습니다. (HTTP ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("네트워크 연결 문제로 Cloudinary 업로드에 실패했습니다. 인터넷 상태를 확인해주세요."));
    };

    xhr.ontimeout = () => {
      reject(new Error("업로드 시간이 초과되었습니다. 다시 시도해주세요."));
    };

    xhr.send(formData);
  });
}
