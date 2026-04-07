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
    key: 'invitation_full',
    i18nKey: 'FULL',
    defaultMusicKey: 'piano_wedding',
    thumbnail: '/templates/full.jpg',
    tags: {
      country: ['GLOBAL'],
      mood: ['CLASSIC', 'PREMIUM', 'MINIMAL'],
      event: ['WEDDING', 'PARTY', 'ANNIVERSARY'],
    },
    price: 5,
    isRecommended: true,
  },
];

export const getTemplateByKey = (key: string): Template | undefined => {
  const normalizedKey =
    key === 'classic' || key === 'wedding_classic' || key === 'funeral_classic' ? 'invitation_full' : key;
  return TEMPLATES.find((t) => t.key === normalizedKey);
};

// 샘플 데이터 (Quick Preview용)
export const SAMPLE_INVITATION_DATA = {
  title: 'Alex & Mina',
  eventDate: '2026-05-16T17:00:00',
  locationText: 'Sample Wedding Hall',
  message: '샘플 인사말 텍스트\n\n함께하는 소중한 순간을\n여러분과 나누고 싶습니다.',
  musicKey: 'piano_wedding',
};
