export type WeddingEditorSetup = {
  invitationType: 'wedding';
  templateKey: 'invitation_full';
  /** 에디터 진입 시 페이지에서 고정; 런타임 변경 불가 */
  readonly conceptType: 'WEDDING' | 'FUNERAL' | 'GENERAL';
  language: 'ko' | 'en' | 'mn';
};

export type WeddingEditorBasic = {
  title: string;
  subtitle?: string;
  eventDateTime: string;
  venueName: string;
  venueDetail?: string;
};

export type WeddingEditorHero = {
  heroImage: string;
  overlayText?: string;
};

export type WeddingEditorInvitationMessage = {
  quote?: string;
  body: string;
};

export type WeddingEditorPerson = {
  name: string;
  photo?: string;
  phone?: string;
  parentsText?: string;
};

export type WeddingEditorImage = {
  id: string;
  url: string;
  name?: string;
  mediaId?: string;
  /** R2 객체 키(삭제 시 우선 사용) */
  objectKey?: string;
};

export type WeddingEditorGallery = {
  images: WeddingEditorImage[];
};

export type WeddingEditorLocation = {
  /** 지도/공개 섹션 장소명 (내부·표시용) */
  venueName?: string;
  /** formattedAddress — 공개 초대장 address 호환 */
  address: string;
  detailAddress?: string;
  googlePlaceId?: string;
  /** 내부 좌표 — UI 미노출 */
  mapLat?: number;
  mapLng?: number;
  transportInfo?: string[];
  parkingInfo?: string[];
};

export type WeddingEditorAccount = {
  id: string;
  /** 용도/구분 */
  role: string;
  /** 은행/금융기관 (글로벌 — 한국 은행 select 제한 금지) */
  bank: string;
  /** 계좌번호 — 항상 string */
  number: string;
  holder: string;
  iban?: string;
  swiftBic?: string;
  routingCode?: string;
  paymentNote?: string;
};

export type WeddingEditorExtras = {
  rsvpEnabled: boolean;
  guestbookEnabled: boolean;
  rsvpButtonText?: string;
  /** GENERAL 선택형 계좌 — OFF여도 accounts 데이터 유지 가능 */
  accountEnabled?: boolean;
  /** 공개 섹션 제목 (미입력 시 concept 기본 라벨) */
  accountsTitle?: string;
  /** 배경 음악 — 기본 미사용 */
  musicEnabled?: boolean;
  musicKey?: string;
  musicFileUrl?: string;
  musicFileKey?: string;
  musicTitle?: string;
  musicLoop?: boolean;
  musicStartAtSeconds?: number;
};

export type WeddingEditorShare = {
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
};

export type WeddingEditorState = {
  setup: WeddingEditorSetup;
  basic: WeddingEditorBasic;
  hero: WeddingEditorHero;
  invitationMessage: WeddingEditorInvitationMessage;
  groom: WeddingEditorPerson;
  bride: WeddingEditorPerson;
  gallery: WeddingEditorGallery;
  location: WeddingEditorLocation;
  accounts: WeddingEditorAccount[];
  extras: WeddingEditorExtras;
  share: WeddingEditorShare;
};
