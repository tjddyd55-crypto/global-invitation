import type { CreatorAvailability, CreatorTemplateCategory } from '@/src/creator/studioConfig';

export type CategoryGuideField = {
  name: string;
  type: string;
  required: boolean;
  example: string;
  designNotes: string;
};

export type CategoryGuideSection = {
  id: string;
  title: string;
  fields: CategoryGuideField[];
  optional?: boolean;
};

export type CategoryGuideDefinition = {
  category: CreatorTemplateCategory;
  label: string;
  description: string;
  useCase: string;
  availability: CreatorAvailability;
  editorType: string;
  keyFieldSummary: string[];
  mediaRules: string[];
  sectionRules: string[];
  sections: CategoryGuideSection[];
};

export const CATEGORY_GUIDES: Record<CreatorTemplateCategory, CategoryGuideDefinition> = {
  wedding: {
    category: 'wedding',
    label: 'Wedding',
    description: '결혼식 초대장 템플릿',
    useCase: '청첩장, 예식 안내, 축의금/RSVP 포함',
    availability: 'active',
    editorType: 'wedding',
    keyFieldSummary: ['coupleNames', 'weddingDateTime', 'venueName', 'heroImage', 'galleryImages', 'rsvp.enabled'],
    mediaRules: [
      'heroImage 권장 비율 16:9',
      'galleryImages 권장 최대 10장',
      'previewThumbnail은 1200x630 권장',
    ],
    sectionRules: [
      '활성 섹션은 sectionOrder에 반드시 포함',
      'gallery는 layout/columns/imageStyle 계약 준수',
      'location은 mapStyle/showTransport/showParking 계약 준수',
    ],
    sections: [
      {
        id: 'hero',
        title: 'Hero',
        fields: [
          { name: 'heroImage', type: 'string(url)', required: true, example: '/media/hero.jpg', designNotes: '최상단 대표 비주얼' },
          { name: 'heroTitle', type: 'string', required: true, example: 'Wedding Invitation', designNotes: '1~2줄 권장' },
        ],
      },
      {
        id: 'basicInfo',
        title: 'Basic Info',
        fields: [
          { name: 'coupleNames', type: 'string', required: true, example: 'Alex & Jamie', designNotes: '가독성 우선' },
          { name: 'weddingDateTime', type: 'string', required: true, example: '2026-05-15 14:00', designNotes: '현지 포맷 고려' },
          { name: 'venueName', type: 'string', required: true, example: 'Grand Ballroom', designNotes: '길이 대응 줄바꿈' },
        ],
      },
      {
        id: 'gallery',
        title: 'Gallery',
        fields: [
          { name: 'galleryImages[]', type: 'string(url)[]', required: false, example: '[/media/1.jpg]', designNotes: 'columns/imageStyle 적용' },
        ],
        optional: true,
      },
      {
        id: 'location',
        title: 'Location',
        fields: [
          { name: 'address', type: 'string', required: true, example: '서울시 구로구 ...', designNotes: 'mapStyle 적용 가능' },
          { name: 'transportInfo[]', type: 'string[]', required: false, example: '["2호선 ..."]', designNotes: 'showTransport 조건 노출' },
          { name: 'parkingInfo[]', type: 'string[]', required: false, example: '["지하주차장"]', designNotes: 'showParking 조건 노출' },
        ],
      },
      {
        id: 'accounts',
        title: 'Accounts',
        fields: [
          { name: 'accounts[]', type: 'array<object>', required: false, example: '[{bank,number,holder}]', designNotes: '계좌 복사 UX 고려' },
        ],
        optional: true,
      },
      {
        id: 'rsvp',
        title: 'RSVP',
        fields: [
          { name: 'rsvp.enabled', type: 'boolean', required: false, example: 'true', designNotes: 'false면 섹션 숨김' },
          { name: 'rsvpTitle', type: 'string', required: false, example: '참석 여부', designNotes: 'CTA 위계 유지' },
        ],
        optional: true,
      },
      {
        id: 'messages',
        title: 'Messages',
        fields: [
          { name: 'messages[]', type: 'array<object>', required: false, example: '[{name,content}]', designNotes: '카드형 영역 권장' },
        ],
        optional: true,
      },
      {
        id: 'share',
        title: 'Share',
        fields: [
          { name: 'ogTitle', type: 'string', required: false, example: 'Wedding Invitation', designNotes: '공유 제목' },
          { name: 'ogImage', type: 'string(url)', required: false, example: '/media/og.jpg', designNotes: '공유 썸네일' },
        ],
        optional: true,
      },
    ],
  },
  funeral: {
    category: 'funeral',
    label: 'Funeral',
    description: '장례식 부고/발인 안내 템플릿',
    useCase: '부고 공유, 빈소 위치/일정 안내',
    availability: 'active',
    editorType: 'funeral',
    keyFieldSummary: ['deceasedName', 'deathDate', 'funeralHall.name', 'schedule.funeralDate'],
    mediaRules: ['portrait/hero 이미지는 4:5 또는 1:1 권장', '지도 이미지는 텍스트 가독성이 우선'],
    sectionRules: ['deceasedInfo 섹션은 필수 안내 정보 유지', 'sectionOrder/활성 섹션 일치 필요'],
    sections: [
      {
        id: 'deceasedInfo',
        title: 'Deceased Info',
        fields: [
          { name: 'deceasedName', type: 'string', required: true, example: '홍길동', designNotes: '제목 영역 overflow 방지' },
          { name: 'deathDate', type: 'string', required: true, example: '2026-05-01', designNotes: '지역 포맷 대비' },
          { name: 'chiefMourner', type: 'string', required: true, example: '장남 홍길남', designNotes: '관계 표기 포함 가능' },
          { name: 'message', type: 'string', required: true, example: '삼가 알립니다.', designNotes: '긴 본문 줄바꿈 처리' },
        ],
      },
      {
        id: 'schedule',
        title: 'Schedule',
        fields: [
          { name: 'schedule.funeralDate', type: 'string', required: true, example: '2026-05-03T09:00:00', designNotes: '핵심 일정은 항상 노출' },
        ],
      },
      {
        id: 'location',
        title: 'Location',
        fields: [
          { name: 'funeralHall.name', type: 'string', required: true, example: '서울장례식장', designNotes: '긴 이름 대응' },
          { name: 'funeralHall.address', type: 'string', required: false, example: '서울시 ...', designNotes: 'mapStyle로 카드/풀 화면 제어' },
        ],
      },
      {
        id: 'messages',
        title: 'Messages',
        fields: [{ name: 'message', type: 'string', required: true, example: '삼가 알립니다.', designNotes: '본문 영역' }],
      },
      {
        id: 'share',
        title: 'Share',
        fields: [{ name: 'share enabled', type: 'boolean', required: false, example: 'true', designNotes: '공유 버튼 노출 제어' }],
      },
    ],
  },
  message: {
    category: 'message',
    label: 'Message',
    description: '감사/공지/브랜디드 카드형 템플릿',
    useCase: '감사 카드, 초청 메시지, 브랜디드 안내',
    availability: 'active',
    editorType: 'message',
    keyFieldSummary: ['title', 'message', 'heroImage/coverImage', 'sender'],
    mediaRules: ['대표 이미지는 카드 비율과 맞는 4:3 또는 16:9 권장'],
    sectionRules: ['sectionOrder 중복 금지', 'share 섹션으로 공유 액션 제어'],
    sections: [
      {
        id: 'message',
        title: 'Message',
        fields: [
          { name: 'title', type: 'string', required: true, example: 'Thank You', designNotes: '짧은 타이틀 우선' },
          { name: 'message', type: 'string', required: true, example: '함께해주셔서 감사합니다.', designNotes: '긴 문장 줄바꿈 처리' },
        ],
      },
      {
        id: 'image',
        title: 'Image',
        fields: [
          { name: 'heroImage/coverImage', type: 'string(url)', required: false, example: '/media/card.jpg', designNotes: '카드 대표 이미지' },
        ],
        optional: true,
      },
      {
        id: 'sender',
        title: 'Sender',
        fields: [
          { name: 'senderName', type: 'string', required: false, example: '홍길동', designNotes: '발신자 정보' },
          { name: 'senderTitle', type: 'string', required: false, example: '대표', designNotes: '보조 정보' },
        ],
        optional: true,
      },
      {
        id: 'share',
        title: 'Share',
        fields: [{ name: 'share enabled', type: 'boolean', required: false, example: 'true', designNotes: '공유 액션 노출 제어' }],
        optional: true,
      },
    ],
  },
  simple_notice: {
    category: 'simple_notice',
    label: 'Simple Notice',
    description: '간단 공지형 템플릿 카테고리',
    useCase: '행사 공지, 운영 공지',
    availability: 'planned',
    editorType: 'planned',
    keyFieldSummary: ['title', 'notice body', 'optional image'],
    mediaRules: ['추후 정의 예정'],
    sectionRules: ['Planned category: submit 비활성'],
    sections: [],
  },
  event: {
    category: 'event',
    label: 'Event',
    description: '이벤트 전용 템플릿 카테고리',
    useCase: '행사 초청/홍보',
    availability: 'planned',
    editorType: 'planned',
    keyFieldSummary: ['title', 'date', 'location', 'program'],
    mediaRules: ['추후 정의 예정'],
    sectionRules: ['Planned category: submit 비활성'],
    sections: [],
  },
  business: {
    category: 'business',
    label: 'Business',
    description: '비즈니스 메시지/초청 템플릿 카테고리',
    useCase: '브랜드 초청장, 세미나 안내',
    availability: 'planned',
    editorType: 'planned',
    keyFieldSummary: ['brand identity', 'message', 'cta'],
    mediaRules: ['추후 정의 예정'],
    sectionRules: ['Planned category: submit 비활성'],
    sections: [],
  },
};

export const CREATOR_CATEGORY_ORDER: CreatorTemplateCategory[] = [
  'wedding',
  'funeral',
  'message',
  'simple_notice',
  'event',
  'business',
];
