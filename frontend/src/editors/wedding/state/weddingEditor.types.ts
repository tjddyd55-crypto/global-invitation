export type WeddingEditorSetup = {
  invitationType: 'wedding';
  templateKey: 'wedding_classic' | 'classic';
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
  body: string[];
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
};

export type WeddingEditorGallery = {
  images: WeddingEditorImage[];
};

export type WeddingEditorLocation = {
  address: string;
  mapLat?: number;
  mapLng?: number;
  transportInfo?: string[];
  parkingInfo?: string[];
};

export type WeddingEditorAccount = {
  id: string;
  role: string;
  bank: string;
  number: string;
  holder: string;
};

export type WeddingEditorExtras = {
  rsvpEnabled: boolean;
  guestbookEnabled: boolean;
  rsvpButtonText?: string;
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
