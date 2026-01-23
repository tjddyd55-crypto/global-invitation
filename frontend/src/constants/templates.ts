export interface Template {
  key: string;
  i18nKey: string; // i18n 키 (예: 'BASIC', 'CLASSIC')
  defaultMusicKey: string;
  thumbnail: string; // 템플릿 썸네일 이미지 경로
  tags: {
    country?: string[]; // 국가 감성 enum 키: 'GLOBAL', 'KOREAN', 'JAPANESE', 'MONGOLIAN'
    mood?: string[]; // 분위기 enum 키: 'BRIGHT', 'VIBRANT', 'MINIMAL', 'CLASSIC', 'PREMIUM', 'EMOTIONAL', 'SIMPLE'
    event?: string[]; // 행사 enum 키: 'WEDDING', 'BIRTHDAY_PARTY', 'BIRTHDAY', 'PARTY', 'ANNIVERSARY'
  };
  price: number; // 0이면 무료, 그 외는 추가 가격 (USD)
  isNew?: boolean; // 최신 여부
  isRecommended?: boolean; // 추천 여부
}

export const TEMPLATES: Template[] = [
  {
    key: 'basic',
    i18nKey: 'BASIC',
    defaultMusicKey: 'piano_soft',
    thumbnail: '/templates/basic.jpg',
    tags: {
      country: ['GLOBAL'],
      mood: ['SIMPLE', 'MINIMAL'],
      event: ['WEDDING', 'ANNIVERSARY'],
    },
    price: 0,
    isRecommended: true,
  },
  {
    key: 'classic',
    i18nKey: 'CLASSIC',
    defaultMusicKey: 'piano_wedding',
    thumbnail: '/templates/classic.jpg',
    tags: {
      country: ['GLOBAL'],
      mood: ['CLASSIC', 'PREMIUM'],
      event: ['WEDDING'],
    },
    price: 5,
    isRecommended: true,
  },
  {
    key: 'modern',
    i18nKey: 'MODERN',
    defaultMusicKey: 'acoustic_guitar',
    thumbnail: '/templates/modern.jpg',
    tags: {
      country: ['GLOBAL'],
      mood: ['MINIMAL', 'VIBRANT'],
      event: ['WEDDING', 'PARTY'],
    },
    price: 10,
    isNew: true,
  },
  {
    key: 'korean_traditional',
    i18nKey: 'KOREAN_TRADITIONAL',
    defaultMusicKey: 'piano_soft',
    thumbnail: '/templates/korean.jpg',
    tags: {
      country: ['KOREAN'],
      mood: ['CLASSIC', 'PREMIUM'],
      event: ['WEDDING', 'BIRTHDAY_PARTY'],
    },
    price: 0,
  },
  {
    key: 'japanese_minimal',
    i18nKey: 'JAPANESE_MINIMAL',
    defaultMusicKey: 'piano_soft',
    thumbnail: '/templates/japanese.jpg',
    tags: {
      country: ['JAPANESE'],
      mood: ['MINIMAL', 'SIMPLE', 'EMOTIONAL'],
      event: ['WEDDING', 'ANNIVERSARY'],
    },
    price: 5,
  },
  {
    key: 'mongolian_festive',
    i18nKey: 'MONGOLIAN_FESTIVE',
    defaultMusicKey: 'acoustic_guitar',
    thumbnail: '/templates/mongolian.jpg',
    tags: {
      country: ['MONGOLIAN'],
      mood: ['VIBRANT', 'BRIGHT'],
      event: ['WEDDING', 'PARTY', 'ANNIVERSARY'],
    },
    price: 0,
    isNew: true,
  },
  {
    key: 'bright_party',
    i18nKey: 'BRIGHT_PARTY',
    defaultMusicKey: 'acoustic_guitar',
    thumbnail: '/templates/bright.jpg',
    tags: {
      country: ['GLOBAL'],
      mood: ['BRIGHT', 'VIBRANT'],
      event: ['BIRTHDAY', 'PARTY', 'ANNIVERSARY'],
    },
    price: 5,
  },
  {
    key: 'elegant_wedding',
    i18nKey: 'ELEGANT_WEDDING',
    defaultMusicKey: 'piano_wedding',
    thumbnail: '/templates/elegant.jpg',
    tags: {
      country: ['GLOBAL'],
      mood: ['PREMIUM', 'CLASSIC'],
      event: ['WEDDING'],
    },
    price: 10,
    isRecommended: true,
  },
];

export const getTemplateByKey = (key: string): Template | undefined => {
  return TEMPLATES.find((t) => t.key === key);
};

// 샘플 데이터 (Quick Preview용)
export const SAMPLE_INVITATION_DATA = {
  title: 'Alex & Mina',
  eventDate: '2026-05-16T17:00:00',
  locationText: 'Sample Wedding Hall',
  message: '샘플 인사말 텍스트\n\n함께하는 소중한 순간을\n여러분과 나누고 싶습니다.',
  musicKey: 'piano_wedding',
};
