export type TemplateImageAsset = {
  url: string;
  alt: string;
  caption?: string;
};

export type WeddingParticipantData = {
  name: string;
  photo?: string;
  phone?: string;
  parentsText?: string;
};

export type WeddingAccountData = {
  bank: string;
  number: string;
  holder: string;
};

export type WeddingMessageData = {
  name: string;
  content: string;
  createdAt?: string;
};

export type WeddingInvitationData = {
  coupleNames: string;
  weddingDateTime: string;
  venueName: string;
  venueDetail?: string;
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroOverlayText?: string;
  introQuote?: string;
  introText: string[];
  groom: WeddingParticipantData;
  bride: WeddingParticipantData;
  galleryImages: string[];
  address: string;
  mapImage?: string;
  transportInfo?: string[];
  parkingInfo?: string[];
  accounts?: WeddingAccountData[];
  rsvp?: {
    enabled?: boolean;
  };
  rsvpTitle?: string;
  rsvpDescription?: string;
  rsvpButton?: string;
  messagesTitle?: string;
  messages?: WeddingMessageData[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
};

export type FuneralInvitationData = {
  deceasedName: string;
  funeralDateTime: string;
  funeralLocation: string;
  portraitImage?: string;
  obituaryText?: string;
  familyMembers?: string[];
  address?: string;
  mapImage?: string;
  visitationTime?: string;
  funeralTime?: string;
  burialTime?: string;
};

export type MessageInvitationData = {
  title: string;
  message: string;
  image?: string;
  senderName?: string;
  senderTitle?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
};

export type TemplateRuntimeData =
  | WeddingInvitationData
  | FuneralInvitationData
  | MessageInvitationData;
