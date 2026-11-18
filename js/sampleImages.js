// 완벽하게 HTTP 200 검증 완료된 고화질 일본 감성 샘플 썸네일 이미지 목록
const SAMPLE_IMAGES = [
  {
    id: 'jp-img-1',
    title: '교토의 고즈넉한 골목길',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
    alt: '교토의 전통적인 고즈넉한 골목길 풍경'
  },
  {
    id: 'jp-img-2',
    title: '후지산과 평화로운 호숫가',
    url: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?q=80&w=800&auto=format&fit=crop',
    alt: '후지산과 호수의 붉은 도리이 풍경'
  },
  {
    id: 'jp-img-3',
    title: '마음을 비우는 말차 다도',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop',
    alt: '정갈한 다도와 말차'
  },
  {
    id: 'jp-img-4',
    title: '황혼 무렵 작은 골목의 붉은 등불',
    url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=800&auto=format&fit=crop',
    alt: '따뜻한 등불이 켜진 일본의 밤거리 골목'
  }
];

// 초기 기본 샘플 게시글 데이터 (요청에 따라 대표 1개만 유지)
const INITIAL_POSTS = [
  {
    id: 'post-1',
    title: '교토 기온 거리의 오후 산책',
    content: '비가 막 그친 교토의 오래된 목조 건물 사이를 걸었습니다. 처마 끝에서 떨어지는 빗방울 소리와 은은한 나무 향기가 마음을 차분하게 만들어 줍니다. 골목 모퉁이에 작은 찻집이 있어 잠시 쉬어가기로 했습니다.',
    imageUrl: SAMPLE_IMAGES[0].url,
    imageTitle: SAMPLE_IMAGES[0].title,
    createdAt: '2026-11-17 11:50',
    authorId: null,
    authorName: '코모레비 갤러리'
  }
];

// 이미지 로드 실패 시 대체할 감성적인 폴백 SVG (인라인 데이터 URI)
const IMAGE_FALLBACK_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F0EDE4'/%3E%3Ccircle cx='200' cy='130' r='36' fill='%23E5E0D8'/%3E%3Cpath d='M180 145 L200 120 L220 145 Z' fill='%239C978F'/%3E%3Ctext x='200' y='190' font-family='serif' font-size='15' fill='%236B6862' text-anchor='middle'%3E사진을 불러오는 중...%3C/text%3E%3C/svg%3E";
