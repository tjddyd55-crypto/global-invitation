type UiLanguage = 'ko' | 'en' | 'mn';

const SECTION_LABELS_KO: Record<string, string> = {
  hero: '메인',
  basicinfo: '기본 정보',
  invitationmessage: '초대글',
  couple: '신랑신부',
  gallery: '갤러리',
  location: '오시는 길',
  accounts: '계좌',
  messages: '메시지',
  rsvp: '참석 여부',
  share: '공유',
  deceasedinfo: '고인 정보',
  schedule: '일정',
  message: '메시지',
  image: '이미지',
  sender: '발신자',
};

const SECTION_LABELS_EN: Record<string, string> = {
  hero: 'Hero',
  basicinfo: 'Basic Info',
  invitationmessage: 'Invitation Message',
  couple: 'Couple',
  gallery: 'Gallery',
  location: 'Location',
  accounts: 'Accounts',
  messages: 'Messages',
  rsvp: 'RSVP',
  share: 'Share',
  deceasedinfo: 'Deceased Info',
  schedule: 'Schedule',
  message: 'Message',
  image: 'Image',
  sender: 'Sender',
};

function normalizeSectionKey(value: string): string {
  return value.replace(/[\s_-]/g, '').toLowerCase();
}

function humanizeSectionKey(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getStudioSectionLabel(sectionKey: string, language: UiLanguage): string {
  const normalized = normalizeSectionKey(sectionKey);
  if (language === 'ko') {
    return SECTION_LABELS_KO[normalized] || humanizeSectionKey(sectionKey);
  }
  return SECTION_LABELS_EN[normalized] || humanizeSectionKey(sectionKey);
}
