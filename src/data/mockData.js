import s1tl from '../assets/s1_tl.jpg';
import s1tr from '../assets/s1_tr.jpg';
import s1bl from '../assets/s1_bl.jpg';
import s1br from '../assets/s1_br.jpg';
import s2tl from '../assets/s2_tl.jpg';
import s2tr from '../assets/s2_tr.jpg';
import s2bl from '../assets/s2_bl.jpg';
import s2br from '../assets/s2_br.jpg';

export const contentTypeOptions = [
  {
    id: 'post',
    label: '포스트',
    helper: '피드 브랜딩과 저장 유도형 캡션에 적합합니다.',
  },
  {
    id: 'reel',
    label: '릴스',
    helper: '짧은 후킹 구조와 흐름 설계까지 함께 보여줍니다.',
  },
];

export const categoryOptions = [
  '카페',
  '패션',
  '피트니스',
  '스터디',
  '뷰티',
  '병원',
  '레스토랑',
  '데일리 라이프',
];

export const defaultDescription =
  '성수에 새로 오픈한 카페의 따뜻한 오후 무드를 담고 싶어요. 창가 좌석, 라떼, 디저트가 함께 보이면 좋겠고 저장을 유도하는 감성적인 톤으로 만들고 싶습니다. 너무 광고 같기보다 프리미엄이지만 편안한 느낌이면 좋겠어요.';

// 두 사진을 각각 4등분 → 총 8컷, 스타일 카드 5장에 배정
export const sampleImages = [
  { id: 's1-tl', src: s1tl, label: '성수동 오후 3:20', subject: '라떼 & 크루아상 플랫레이', background: 'linear-gradient(145deg,#f7e1ce,#e8b994,#7f5b4b)', glowA: 'rgba(255,244,214,0.96)', glowB: 'rgba(255,196,146,0.52)' },
  { id: 's2-tl', src: s2tl, label: '카페 감성 오후', subject: '라떼 & 베이커리 플랫레이', background: 'linear-gradient(145deg,#dff0e8,#a8cdb8,#4a7a60)', glowA: 'rgba(220,245,232,0.96)', glowB: 'rgba(168,205,184,0.52)' },
  { id: 's1-tr', src: s1tr, label: '성수동 오후 3:20', subject: '창가 아이스라떼 & 디저트', background: 'linear-gradient(145deg,#fde8d8,#f0b98a,#c07040)', glowA: 'rgba(255,232,210,0.96)', glowB: 'rgba(240,185,138,0.52)' },
  { id: 's2-tr', src: s2tr, label: '카페 테라스 낮', subject: '시바견 & 아이스라떼', background: 'linear-gradient(145deg,#fff0d0,#f5c870,#c08030)', glowA: 'rgba(255,240,200,0.96)', glowB: 'rgba(245,200,112,0.52)' },
  { id: 's1-bl', src: s1bl, label: '성수동 오후 3:20', subject: '바리스타 블랙앤화이트', background: 'linear-gradient(145deg,#e8e8e8,#a0a0a0,#404040)', glowA: 'rgba(240,240,240,0.96)', glowB: 'rgba(160,160,160,0.52)' },
  { id: 's2-bl', src: s2bl, label: '카페 인테리어 낮', subject: '따뜻한 카페 내부 무드', background: 'linear-gradient(145deg,#fae8c8,#e8b870,#a07030)', glowA: 'rgba(250,232,200,0.96)', glowB: 'rgba(232,184,112,0.52)' },
  { id: 's1-br', src: s1br, label: '성수동 카페 테이블', subject: '라떼 & 디저트 감성 테이블', background: 'linear-gradient(145deg,#fdecd8,#f0c090,#c08050)', glowA: 'rgba(253,236,216,0.96)', glowB: 'rgba(240,192,144,0.52)' },
  { id: 's2-br', src: s2br, label: '카페 야경', subject: '네온 카페 외관 야경', background: 'linear-gradient(145deg,#d0d8f0,#7090d0,#304080)', glowA: 'rgba(208,216,240,0.96)', glowB: 'rgba(112,144,208,0.52)' },
];

const analysisProfiles = {
  카페: {
    category: '카페 브랜딩',
    audience: '20대 후반~30대 초반 여성',
    tone: '따뜻하고 코지한 감성',
    keywords: ['미니멀', '소프트 라이트', '프리미엄', '뉴트럴 톤', '스토리텔링'],
    industryAccounts: '라이프스타일 카페, 디저트 브랜드, 무드형 소상공인 계정',
    insight:
      '저장 유도형 감성 컷과 짧은 스토리텔링이 함께 있을 때 체류 시간과 저장률이 가장 안정적으로 올라갑니다.',
    postTime: '오전 8:30 / 오후 7:00',
    reelTime: '오후 12:30 / 오후 8:15',
    responseSignal: '감성 저장 +21%, 위치 기반 유입 +13%',
  },
  패션: {
    category: '패션 룩북',
    audience: '트렌드 민감도가 높은 20대 여성',
    tone: '트렌디하고 에디토리얼한 무드',
    keywords: ['룩북', '하이라이트', '에디토리얼', '쿨톤', '레퍼런스'],
    industryAccounts: '디자이너 브랜드, 편집샵, 시즌 드롭 캠페인 계정',
    insight:
      '룩 전체를 한 컷에 담기보다 디테일과 착장 포인트를 분리해서 보여줄 때 저장과 공유 반응이 좋습니다.',
    postTime: '오후 1:00 / 오후 8:45',
    reelTime: '오전 11:30 / 오후 9:10',
    responseSignal: '공유율 +18%, 팔로우 전환 +9%',
  },
  피트니스: {
    category: '피트니스 동기부여',
    audience: '루틴 콘텐츠를 소비하는 20~30대',
    tone: '에너지 있고 명확한 동기부여',
    keywords: ['루틴', '전후 대비', '몰입감', '집중', '동작 포인트'],
    industryAccounts: 'PT 센터, 홈트 코치, 영양 브랜드 계정',
    insight:
      '짧고 분명한 훅, 동작 포인트 요약, CTA가 결합될 때 릴스 완주율이 높아집니다.',
    postTime: '오전 6:40 / 오후 6:10',
    reelTime: '오전 7:20 / 오후 9:00',
    responseSignal: '완주율 +16%, 댓글 반응 +12%',
  },
  스터디: {
    category: '스터디 몰입형 콘텐츠',
    audience: '생산성과 루틴에 관심 많은 학생 및 직장인',
    tone: '차분하고 집중감 있는 분위기',
    keywords: ['몰입', '정리', '루틴', '정적', '클린 셋업'],
    industryAccounts: '스터디 카페, 생산성 계정, 학습용 브랜드',
    insight:
      '정돈된 책상컷과 짧은 문장형 캡션이 저장 유도에 효과적이며, 지나친 정보량은 반응을 떨어뜨립니다.',
    postTime: '오전 7:50 / 오후 9:20',
    reelTime: '오후 5:50 / 오후 10:00',
    responseSignal: '저장률 +19%, 프로필 클릭 +8%',
  },
  뷰티: {
    category: '뷰티 제품 하이라이트',
    audience: '제품 비교와 발색 정보를 찾는 20~30대 여성',
    tone: '깨끗하고 프리미엄한 제품 설명형',
    keywords: ['글로시', '클린 컷', '톤 다운', '디테일', '전환 유도'],
    industryAccounts: '코스메틱 브랜드, 스킨케어 신제품, 뷰티 편집몰 계정',
    insight:
      '제품 중심 클로즈업과 간결한 CTA가 결합될 때 구매 페이지 전환과 저장 유도가 동시에 높아집니다.',
    postTime: '오전 10:10 / 오후 8:00',
    reelTime: '오후 1:20 / 오후 8:40',
    responseSignal: '제품 클릭 +14%, 탐색 유입 +11%',
  },
  병원: {
    category: '병원 신뢰형 브랜딩',
    audience: '전문성과 친절함을 함께 보고 싶은 30~40대',
    tone: '안정적이고 신뢰감 있는 정보형',
    keywords: ['신뢰', '전문성', '밝은 톤', '상담', '설명'],
    industryAccounts: '치과, 피부과, 여성병원 등 지역 기반 의료 계정',
    insight:
      '전문가 이미지와 환자 관점 설명이 균형을 이룰 때 광고 피로도가 낮고 문의 전환이 좋아집니다.',
    postTime: '오전 9:30 / 오후 6:20',
    reelTime: '오전 11:00 / 오후 7:30',
    responseSignal: '문의 클릭 +10%, 저장률 +8%',
  },
  레스토랑: {
    category: '레스토랑 메뉴 프로모션',
    audience: '맛집 탐색 빈도가 높은 20~30대',
    tone: '식욕을 자극하는 감각형',
    keywords: ['먹음직', '클로즈업', '디테일', '동선', '분위기'],
    industryAccounts: '브런치 레스토랑, 파인 다이닝, 신메뉴 프로모션 계정',
    insight:
      '메뉴 디테일 컷과 공간 분위기를 함께 보여줄 때 방문 유도와 저장 반응이 함께 올라갑니다.',
    postTime: '오전 11:30 / 오후 5:50',
    reelTime: '오전 11:00 / 오후 6:40',
    responseSignal: '위치 저장 +17%, 댓글 문의 +12%',
  },
  '데일리 라이프': {
    category: '데일리 무드 브랜딩',
    audience: '감성 사진과 기록형 콘텐츠를 즐기는 20대',
    tone: '가볍지만 세련된 일상 감성',
    keywords: ['여백', '기록', '소프트 포커스', '자연광', '일상성'],
    industryAccounts: '라이프스타일 크리에이터, 감성 브랜드, 개인 브랜딩 계정',
    insight:
      '광고처럼 보이지 않는 자연스러운 일상 컷에 짧은 감정선 캡션이 붙으면 공유와 저장률이 안정적으로 올라갑니다.',
    postTime: '오전 9:10 / 오후 7:40',
    reelTime: '오후 12:00 / 오후 8:20',
    responseSignal: '공유율 +14%, 저장률 +15%',
  },
};

const baseStyles = [
  {
    id: 'minimal-warm-branding',
    name: '따뜻한 감성 무드',
    subtitle: '웜톤 감성 · 저장 유도',
    badge: '저장 유도형 상위',
    baseScore: 88,
    summary:
      '따뜻한 자연광과 여백 있는 구성으로 브랜드 무드를 고급스럽게 정리하는 정석형 스타일입니다.',
    whyPerforms:
      '카페, 라이프스타일, 뷰티 계정에서 안정적인 저장률을 보이며 광고 피로도를 낮추는 편입니다.',
    visualCharacteristics: ['4:5 세로 크롭', '웜 뉴트럴 톤', '텍스트 최소화', '부드러운 노출'],
    captionTone: '차분하고 여백 있는 감성형',
    fitCategories: ['카페', '뷰티', '데일리 라이프'],
    keywordBoosts: ['따뜻', '감성', '조명', '라떼', '여유'],
    boosts: {
      post: 4,
      reel: 1,
      categories: { 카페: 4, 뷰티: 2, '데일리 라이프': 2 },
    },
    accent: '#E86A4D',
    gradient: 'linear-gradient(135deg, #FBE7D4 0%, #F1C49B 55%, #DD835A 100%)',
    filterStyle: 'sepia(0.14) brightness(1.04) saturate(0.92)',
    editedFilterStyle: 'sepia(0.28) brightness(1.08) saturate(0.88) contrast(0.96)',
    preview: {
      crop: '4:5 portrait',
      tone: '웜 뉴트럴',
      contrast: 'soft',
      overlayText: '없음',
      adjustments: [
        '하이라이트를 살짝 낮춰 창가의 따뜻한 빛이 날아가지 않도록 유지합니다.',
        '베이지 계열 컬러를 통일해 브랜드 무드를 부드럽고 고급스럽게 만듭니다.',
        '디저트와 컵 사이 간격을 정리해 시선이 한 번에 읽히도록 리프레이밍합니다.',
      ],
    },
    captionGuides: [
      '첫 줄은 공간의 감정부터 시작',
      '중간 문단은 쉬어갈 이유를 제시',
      '마지막 줄은 저장 유도 CTA',
    ],
    captions: [
      `오늘의 분위기를 담은 공간.\n바쁜 일상 속에서 잠시 쉬어갈 수 있는 작은 여유를 준비했어요.\n은은한 조명, 따뜻한 톤, 그리고 가장 편안한 한 잔까지.\n저장해두고 다음 주말에 꼭 들러보세요.`,
      `햇살이 가장 부드럽게 머무는 시간에,\n우리가 좋아하는 한 잔과 디저트를 담았습니다.\n오래 머물고 싶은 무드가 필요했던 날이라면 이 공간을 기억해 주세요.\n다음 일정 사이, 가볍게 저장해두기 좋은 카페입니다.`,
      `복잡한 하루 끝에 필요한 건,\n생각보다 거창한 위로보다도 편안한 공기와 조용한 한 잔일지 몰라요.\n따뜻한 조명과 여유로운 테이블, 지금 가장 예쁜 시간대의 카페를 기록합니다.\n주말 코스로 저장해 두셔도 좋아요.`,
    ],
    hashtags: [
      { tag: '#카페추천', group: '탐색', reach: '상' },
      { tag: '#감성카페', group: '브랜드', reach: '상' },
      { tag: '#서울카페', group: '지역', reach: '중' },
      { tag: '#카페스타그램', group: '리치', reach: '상' },
      { tag: '#브랜딩콘텐츠', group: '브랜드', reach: '중' },
      { tag: '#감성사진', group: '탐색', reach: '중' },
      { tag: '#인스타감성', group: '리치', reach: '중' },
      { tag: '#성수카페', group: '지역', reach: '중' },
      { tag: '#주말카페', group: '탐색', reach: '중' },
      { tag: '#무드브랜딩', group: '브랜드', reach: '중' },
    ],
    reelFlow: [
      { second: '0-2s', label: '무드 훅', description: '창가 빛과 디저트 테이블을 가장 넓은 앵글로 보여주며 첫 2초에 분위기를 각인합니다.', focus: '저장하고 싶은 첫인상 만들기' },
      { second: '2-5s', label: '시그니처 컷', description: '라떼와 디저트를 클로즈업해 메뉴의 디테일과 따뜻한 톤을 부각합니다.', focus: '주력 메뉴 인지' },
      { second: '5-8s', label: '공간 디테일', description: '좌석, 조명, 테이블 텍스처를 빠르게 이어 붙여 공간 무드를 확장합니다.', focus: '공간 브랜딩 강화' },
      { second: '8-12s', label: '저장 CTA', description: '브랜드 태그라인과 위치 힌트를 넣고 저장/방문 유도 문구로 마무리합니다.', focus: '행동 유도' },
    ],
  },
  {
    id: 'trendy-lifestyle-editorial',
    name: '세련된 에디토리얼',
    subtitle: '트렌디 · 탐색 유입형',
    badge: '탐색 유입 강세',
    baseScore: 85,
    summary:
      '에디토리얼한 구도와 트렌디한 컷 편집으로 브랜드를 감각적으로 보이게 만드는 스타일입니다.',
    whyPerforms:
      '패션, 데일리 라이프 계정에서 탐색 유입이 잘 붙고 젊은 타깃에게 세련된 인상을 남깁니다.',
    visualCharacteristics: ['1:1 정방형', '쿨 베이지', '프레임 분할', '리듬감 있는 컷'],
    captionTone: '세련되고 리듬감 있는 트렌드형',
    fitCategories: ['패션', '데일리 라이프', '카페'],
    keywordBoosts: ['트렌디', '룩북', '무드', '에디토리얼', '쇼룸'],
    boosts: {
      post: 3,
      reel: 2,
      categories: { 패션: 4, '데일리 라이프': 3, 카페: 1 },
    },
    accent: '#6E5EF6',
    gradient: 'linear-gradient(135deg, #E8E4FF 0%, #D1C8FF 56%, #8A7BFF 100%)',
    filterStyle: 'brightness(1.02) saturate(1.06) contrast(1.03)',
    editedFilterStyle: 'brightness(1.01) saturate(1.18) contrast(1.1)',
    preview: {
      crop: '1:1 square',
      tone: '쿨 베이지',
      contrast: 'medium',
      overlayText: '브랜드 태그라인',
      adjustments: [
        '컷 분할을 통해 정적인 사진도 더 에디토리얼하게 느껴지도록 설계합니다.',
        '중립 톤을 유지하되 채도를 약간 올려 탐색 화면에서 멈춤 포인트를 만듭니다.',
        '브랜드 태그라인을 얇게 배치해 무드 보드 같은 느낌을 강화합니다.',
      ],
    },
    captionGuides: [
      '첫 줄은 감정이 아닌 장면으로 시작',
      '브랜드 태도와 취향을 드러내기',
      '짧고 리듬감 있게 마무리',
    ],
    captions: [
      `오늘의 무드는 조금 더 가볍고 선명하게.\n익숙한 장면도 프레임을 바꾸면 전혀 다른 인상이 됩니다.\n브랜드의 취향이 가장 잘 보이는 순간만 담아봤어요.\n지금 저장해두고 다음 촬영 레퍼런스로 꺼내보세요.`,
      `우리가 좋아하는 건 결국 디테일.\n빛이 스치는 질감, 여백이 남는 구도, 그리고 브랜드를 설명하는 작은 힌트들.\n이번 피드는 조금 더 에디토리얼하게 정리했습니다.\n스크랩해 두기 좋은 무드 보드로 봐주세요.`,
      `과하게 꾸미지 않아도 충분히 눈에 남는 장면.\n한 컷 안에 분위기와 브랜드 태도를 함께 담았습니다.\n이번 주 피드 무드가 필요했다면 이 방향을 참고해도 좋아요.`,
    ],
    hashtags: [
      { tag: '#라이프스타일브랜딩', group: '브랜드', reach: '중' },
      { tag: '#에디토리얼무드', group: '탐색', reach: '중' },
      { tag: '#감각적인피드', group: '리치', reach: '중' },
      { tag: '#룩북레퍼런스', group: '탐색', reach: '상' },
      { tag: '#브랜드무드보드', group: '브랜드', reach: '중' },
      { tag: '#피드디자인', group: '리치', reach: '중' },
      { tag: '#한남쇼룸', group: '지역', reach: '중' },
      { tag: '#취향기록', group: '탐색', reach: '중' },
      { tag: '#스타일레퍼런스', group: '리치', reach: '상' },
      { tag: '#브랜드촬영', group: '브랜드', reach: '중' },
    ],
    reelFlow: [
      { second: '0-2s', label: '분위기 컷 인트로', description: '전체 룩과 디스플레이를 빠르게 보여주며 에디토리얼 무드를 첫 컷에 심습니다.', focus: '브랜드 무드 인지' },
      { second: '2-5s', label: '디테일 컷', description: '소재감, 핏, 소품을 짧게 분절해 리듬감을 만듭니다.', focus: '탐색 유입 강화' },
      { second: '5-8s', label: '프레임 전환', description: '1:1 구도와 클로즈업을 교차 배치해 몰입감을 더합니다.', focus: '시각적 리듬' },
      { second: '8-12s', label: '브랜드 엔딩', description: '쇼룸 위치 또는 시즌 드롭 문구를 얇게 얹어 기억 포인트를 남깁니다.', focus: '브랜드 기억 강화' },
    ],
  },
  {
    id: 'clean-product-highlight',
    name: '깔끔한 제품·메뉴 강조',
    subtitle: '클린 제품 · 전환 유도',
    badge: '전환 유도 강점',
    baseScore: 84,
    summary:
      '제품과 메뉴를 가장 깔끔하게 보이게 정리해 CTA 전환과 제품 인지에 강한 스타일입니다.',
    whyPerforms:
      '뷰티, 레스토랑, 신메뉴 프로모션 계정에서 클릭과 문의 전환이 높은 편입니다.',
    visualCharacteristics: ['1:1 정리형', '클린 화이트', '제품 중심', '텍스트 최소화'],
    captionTone: '정보 전달형이지만 세련된 설득형',
    fitCategories: ['뷰티', '레스토랑', '병원'],
    keywordBoosts: ['제품', '신메뉴', '디테일', '메뉴', '클린'],
    boosts: {
      post: 4,
      reel: 1,
      categories: { 뷰티: 4, 레스토랑: 3, 병원: 1 },
    },
    accent: '#2F93C6',
    gradient: 'linear-gradient(135deg, #DEF0FB 0%, #BCE4F8 56%, #62B7E3 100%)',
    filterStyle: 'brightness(1.08) contrast(0.98) saturate(0.88)',
    editedFilterStyle: 'brightness(1.14) contrast(0.94) saturate(0.8)',
    preview: {
      crop: '1:1 square',
      tone: '클린 브라이트',
      contrast: 'low',
      overlayText: '제품 포인트',
      adjustments: [
        '배경 톤을 정리해 제품과 메뉴가 가장 먼저 읽히도록 만듭니다.',
        '반사광을 조금만 남겨 프리미엄한 질감을 유지하되 복잡함은 줄입니다.',
        '텍스트는 핵심 혜택만 짧게 얹어 정보형 카드처럼 보이게 정리합니다.',
      ],
    },
    captionGuides: [
      '첫 줄은 핵심 베네핏 제시',
      '중간 문단은 사용 장면 또는 메뉴 특징 설명',
      '마지막 줄은 문의/방문 CTA',
    ],
    captions: [
      `한눈에 보기 쉬운 디테일이 결국 선택을 만듭니다.\n이번 신메뉴는 부드러운 밸런스와 깔끔한 마감이 포인트예요.\n사진 한 장만 봐도 어떤 무드인지 바로 느껴질 수 있도록 정리했습니다.\n메뉴 저장해두고 방문 전에 참고해 보세요.`,
      `복잡한 설명 없이도 충분히 매력적인 순간.\n빛과 질감이 가장 잘 보이는 컷으로 제품의 포인트만 선명하게 담았습니다.\n궁금했던 분들은 이번 피드에서 디테일을 먼저 확인해 주세요.`,
      `지금 가장 집중해서 보여주고 싶은 한 가지.\n불필요한 요소는 줄이고, 제품이 가진 매력은 더 또렷하게 정리했습니다.\n관심 있던 분들은 저장 후 비교해 보셔도 좋아요.`,
    ],
    hashtags: [
      { tag: '#신메뉴추천', group: '탐색', reach: '상' },
      { tag: '#제품하이라이트', group: '브랜드', reach: '중' },
      { tag: '#클린브랜딩', group: '브랜드', reach: '중' },
      { tag: '#메뉴디테일', group: '탐색', reach: '중' },
      { tag: '#브랜드콘텐츠', group: '브랜드', reach: '중' },
      { tag: '#인스타피드', group: '리치', reach: '중' },
      { tag: '#청담뷰티', group: '지역', reach: '중' },
      { tag: '#제품촬영', group: '탐색', reach: '중' },
      { tag: '#신제품홍보', group: '리치', reach: '상' },
      { tag: '#깔끔한피드', group: '리치', reach: '중' },
    ],
    reelFlow: [
      { second: '0-2s', label: '제품 전면 노출', description: '제품 또는 메뉴를 정면으로 빠르게 보여주며 핵심 포인트를 첫 순간에 전달합니다.', focus: '제품 인지 확보' },
      { second: '2-5s', label: '텍스처 디테일', description: '질감, 반사광, 디테일 컷을 짧게 연결해 프리미엄한 인상을 남깁니다.', focus: '디테일 강조' },
      { second: '5-8s', label: '베네핏 컷', description: '핵심 장점 또는 메뉴 포인트를 자막과 함께 한 번 더 정리합니다.', focus: '정보 명확화' },
      { second: '8-12s', label: '문의/방문 CTA', description: '혜택 문구와 함께 저장, 방문, 문의를 유도하는 엔딩 컷으로 마무리합니다.', focus: '전환 유도' },
    ],
  },
  {
    id: 'cozy-storytelling-post',
    name: '일상 공감 스토리',
    subtitle: '진정성 · 댓글 반응형',
    badge: '댓글 반응 강세',
    baseScore: 87,
    summary:
      '감정선을 담은 사진과 긴 호흡의 문장으로 브랜드에 사람 냄새를 더하는 스토리형 스타일입니다.',
    whyPerforms:
      '카페, 스터디, 데일리 계정에서 공감형 댓글과 저장률을 동시에 끌어올리는 데 유리합니다.',
    visualCharacteristics: ['4:5 포트레이트', '로우 콘트라스트', '필름 느낌', '여백 있는 레이아웃'],
    captionTone: '다정하고 진정성 있는 스토리형',
    fitCategories: ['카페', '스터디', '데일리 라이프'],
    keywordBoosts: ['스토리', '편안', '기억', '기록', '감성'],
    boosts: {
      post: 5,
      reel: 0,
      categories: { 카페: 3, 스터디: 3, '데일리 라이프': 4 },
    },
    accent: '#D95C77',
    gradient: 'linear-gradient(135deg, #FFE0E7 0%, #F6B7C7 56%, #EA7B95 100%)',
    filterStyle: 'sepia(0.1) brightness(1.03) saturate(0.92)',
    editedFilterStyle: 'sepia(0.22) brightness(1.07) saturate(0.86) contrast(0.96)',
    preview: {
      crop: '4:5 portrait',
      tone: '더스티 로즈',
      contrast: 'low soft',
      overlayText: '없음',
      adjustments: [
        '필름처럼 부드러운 명암으로 눈에 피로감 없는 감성 컷을 만듭니다.',
        '프레임 안의 여백을 조금 더 남겨 캡션이 가진 감정선과 연결되도록 설계합니다.',
        '색온도를 살짝 올려 기억을 꺼내 보는 듯한 편안한 인상을 강화합니다.',
      ],
    },
    captionGuides: [
      '도입은 감정 또는 장면 한 줄',
      '중간은 공감 가능한 디테일',
      '마무리는 저장하거나 떠올리게 하는 문장',
    ],
    captions: [
      `기억에 오래 남는 공간은 늘 디테일이 다르더라고요.\n한 잔의 온도, 조용히 머무는 빛, 그리고 생각보다 오래 머물게 되는 분위기까지.\n오늘은 그런 순간을 조금 천천히 담아봤습니다.\n다음에 쉬어가고 싶은 날을 위해 저장해 두세요.`,
      `마음이 조금 복잡한 날에는\n큰 자극보다도 조용히 정리되는 공간이 더 필요할 때가 있어요.\n따뜻한 조명과 편안한 시선으로, 오래 머무르고 싶은 장면을 기록했습니다.\n이 무드를 기억하고 싶다면 저장해 주세요.`,
      `한 장의 사진으로도 설명되는 날이 있죠.\n말을 많이 하지 않아도 충분히 전해지는 공기와 결이 있습니다.\n이번 포스트는 그런 온도를 그대로 남기고 싶어서 조금 더 천천히 만들었어요.\n필요한 날 다시 꺼내 보기 좋게 저장해 두세요.`,
    ],
    hashtags: [
      { tag: '#무드포스트', group: '탐색', reach: '중' },
      { tag: '#감성브랜딩', group: '브랜드', reach: '상' },
      { tag: '#스토리텔링콘텐츠', group: '브랜드', reach: '중' },
      { tag: '#분위기좋은카페', group: '탐색', reach: '상' },
      { tag: '#일상기록', group: '리치', reach: '중' },
      { tag: '#주말무드', group: '리치', reach: '중' },
      { tag: '#성수감성', group: '지역', reach: '중' },
      { tag: '#공간기록', group: '탐색', reach: '중' },
      { tag: '#브랜드스토리', group: '브랜드', reach: '중' },
      { tag: '#저장하고싶은피드', group: '리치', reach: '중' },
    ],
    reelFlow: [
      { second: '0-2s', label: '기억 컷', description: '조용한 공간 한 컷으로 감정선을 먼저 건드리는 도입을 만듭니다.', focus: '공감 유도' },
      { second: '2-5s', label: '사소한 디테일', description: '컵, 책, 조명 같은 작은 요소를 천천히 이어 붙입니다.', focus: '몰입감 형성' },
      { second: '5-8s', label: '무드 확장', description: '공간 전체와 앉아 있는 시선 컷을 교차해 이야기를 넓혀갑니다.', focus: '브랜드 인상 강화' },
      { second: '8-12s', label: '여운 남기기', description: '짧은 한 줄 텍스트와 저장 CTA로 감정선을 유지한 채 마무리합니다.', focus: '저장 유도' },
    ],
  },
  {
    id: 'high-contrast-viral-reel',
    name: '강렬한 바이럴 릴스',
    subtitle: '강한 훅 · 도달 극대화',
    badge: '릴스 도달 강세',
    baseScore: 83,
    summary:
      '빠른 컷 전환과 높은 대비로 첫 3초 집중도를 끌어올리는 릴스 최적화 스타일입니다.',
    whyPerforms:
      '피트니스, 레스토랑, 프로모션성 릴스에서 도달과 완주율이 강하게 나오는 편입니다.',
    visualCharacteristics: ['9:16 세로 릴스', '하이 콘트라스트', '강한 훅 텍스트', '빠른 컷 편집'],
    captionTone: '직관적이고 강한 CTA형',
    fitCategories: ['피트니스', '레스토랑', '패션'],
    keywordBoosts: ['릴스', '후킹', '전환', '강렬', '바이럴'],
    boosts: {
      post: 0,
      reel: 6,
      categories: { 피트니스: 5, 레스토랑: 2, 패션: 2 },
    },
    accent: '#16A085',
    gradient: 'linear-gradient(135deg, #DDF7EF 0%, #B7EDD8 55%, #46C09E 100%)',
    filterStyle: 'contrast(1.14) saturate(1.1) brightness(0.99)',
    editedFilterStyle: 'contrast(1.3) saturate(1.22) brightness(0.96)',
    preview: {
      crop: '9:16 reel',
      tone: '비비드 콘트라스트',
      contrast: 'high',
      overlayText: '핵심 카피 삽입',
      adjustments: [
        '첫 2초 안에 화면 대비를 크게 줘 스크롤 멈춤 가능성을 높입니다.',
        '텍스트 오버레이를 활용해 장면만으로 설명되지 않는 포인트를 즉시 전달합니다.',
        '컷 간 속도감을 살려 릴스 완주율에 유리한 리듬을 만듭니다.',
      ],
    },
    captionGuides: [
      '첫 문장은 훅 카피처럼 짧게',
      '중간은 핵심 포인트 2줄 이내',
      '마지막은 행동 유도 CTA',
    ],
    captions: [
      `지금 가장 분위기 좋은 컷만 빠르게 모았습니다.\n한 번 보면 저장하고 싶은 무드, 한 번 더 보면 바로 방문하고 싶은 흐름.\n다음 릴스 레퍼런스로 저장해 두세요.`,
      `첫 3초 안에 시선을 붙잡는 건 결국 대비와 리듬.\n이번 릴스는 공간과 메뉴의 포인트를 가장 빠르게 읽히게 설계했습니다.\n브랜드 무드를 짧고 강하게 남기고 싶다면 이 방향이 잘 맞아요.`,
      `멈추게 하는 첫 장면, 기억에 남는 마지막 문장.\n짧은 릴스에서도 브랜드 포인트를 확실히 남길 수 있도록 구성했습니다.\n저장하고 다음 촬영 콘셉트에 바로 써보세요.`,
    ],
    hashtags: [
      { tag: '#릴스아이디어', group: '탐색', reach: '상' },
      { tag: '#바이럴릴스', group: '리치', reach: '상' },
      { tag: '#콘텐츠마케팅', group: '브랜드', reach: '상' },
      { tag: '#릴스제작', group: '탐색', reach: '중' },
      { tag: '#브랜드릴스', group: '브랜드', reach: '중' },
      { tag: '#후킹콘텐츠', group: '리치', reach: '상' },
      { tag: '#트렌드콘텐츠', group: '탐색', reach: '중' },
      { tag: '#도달올리기', group: '리치', reach: '중' },
      { tag: '#서울핫플', group: '지역', reach: '중' },
      { tag: '#릴스무드', group: '탐색', reach: '중' },
    ],
    reelFlow: [
      { second: '0-1s', label: '강한 훅', description: '핵심 비주얼과 카피를 동시에 보여주며 스크롤을 멈추게 합니다.', focus: '첫 1초 집중' },
      { second: '1-4s', label: '빠른 전환', description: '디테일 컷과 공간 컷을 빠르게 교차해 리듬을 만듭니다.', focus: '이탈 방지' },
      { second: '4-8s', label: '메시지 강조', description: '자막으로 브랜드 포인트를 덧입혀 장면의 의미를 명확히 합니다.', focus: '메시지 인지' },
      { second: '8-12s', label: '행동 유도 엔딩', description: '저장, 방문, 문의 중 하나의 CTA를 강하게 남기며 끝냅니다.', focus: '도달 후 행동 유도' },
    ],
  },
];

export const savedProjects = [
  { id: 1, name: '스프링 카페 런칭', type: 'POST', date: '04.10', status: '완료', colorFrom: '#FBE7D4', colorTo: '#F1C49B' },
  { id: 2, name: '신규 디저트 메뉴 프로모션', type: 'REEL', date: '04.08', status: '완료', colorFrom: '#FFE0E7', colorTo: '#F6B7C7' },
  { id: 3, name: '스터디 카페 릴스 초안', type: 'REEL', date: '04.05', status: '초안', colorFrom: '#DEF0FB', colorTo: '#BCE4F8' },
  { id: 4, name: '주말 무드보드 포스트', type: 'POST', date: '04.03', status: '완료', colorFrom: '#E8E4FF', colorTo: '#D1C8FF' },
];

export const workspaceStats = [
  { label: '팔로워 수', value: '12,480', delta: '+127명 이번 주', icon: 'users' },
  { label: '게시물 도달', value: '4,280', delta: '게시물당 평균', icon: 'reach' },
  { label: '참여율', value: '6.3%', delta: '+0.8%p 상승', icon: 'engage' },
  { label: '주간 노출', value: '28.4K', delta: '전주 대비 +12%', icon: 'eye' },
];

const descriptionSignals = [
  { keywords: ['따뜻', '감성', '무드', '조명', '라떼'], styles: ['minimal-warm-branding', 'cozy-storytelling-post'] },
  { keywords: ['트렌디', '룩북', '에디토리얼', '쇼룸'], styles: ['trendy-lifestyle-editorial'] },
  { keywords: ['제품', '신메뉴', '디테일', '메뉴', '클린'], styles: ['clean-product-highlight'] },
  { keywords: ['릴스', '후킹', '강렬', '전환', '바이럴'], styles: ['high-contrast-viral-reel'] },
];

function clampScore(score) {
  return Math.max(80, Math.min(97, score));
}

function resolvePrimaryCategory(selectedCategories) {
  return selectedCategories[0] ?? '카페';
}

export function getAnalysisResult(selectedCategories, contentType) {
  const primaryCategory = resolvePrimaryCategory(selectedCategories);
  const profile = analysisProfiles[primaryCategory] ?? analysisProfiles.카페;

  return {
    category: profile.category,
    audience: profile.audience,
    tone: profile.tone,
    keywords: profile.keywords,
    industryAccounts: profile.industryAccounts,
    insight: profile.insight,
    optimalTime: contentType === 'reel' ? profile.reelTime : profile.postTime,
    responseSignal: profile.responseSignal,
  };
}

export function buildStyleRecommendations({ contentType, selectedCategories, description }) {
  const normalizedDescription = description.toLowerCase();
  const scoreBoostMap = new Map();

  descriptionSignals.forEach((signal) => {
    if (signal.keywords.some((keyword) => normalizedDescription.includes(keyword.toLowerCase()))) {
      signal.styles.forEach((styleId) => {
        scoreBoostMap.set(styleId, (scoreBoostMap.get(styleId) ?? 0) + 3);
      });
    }
  });

  const typeKey = contentType === 'reel' ? 'reel' : 'post';

  return baseStyles
    .map((style) => {
      let score = style.baseScore;
      score += style.boosts[typeKey] ?? 0;
      score += scoreBoostMap.get(style.id) ?? 0;

      selectedCategories.forEach((category) => {
        score += style.boosts.categories[category] ?? 0;
        if (style.fitCategories.includes(category)) {
          score += 1;
        }
      });

      return {
        ...style,
        score: clampScore(score),
        fitReason:
          typeKey === 'reel'
            ? '릴스 흐름과 업종 톤이 잘 맞는 조합'
            : '피드 저장 유도에 유리한 조합',
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}
