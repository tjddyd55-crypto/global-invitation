import type {
  WeddingEditorAccount,
  WeddingEditorBasic,
  WeddingEditorExtras,
  WeddingEditorGallery,
  WeddingEditorHero,
  WeddingEditorInvitationMessage,
  WeddingEditorLocation,
  WeddingEditorPerson,
  WeddingEditorSetup,
  WeddingEditorShare,
  WeddingEditorImage,
} from './weddingEditor.types';

export type WeddingEditorAction =
  | { type: 'SET_SETUP'; payload: Partial<WeddingEditorSetup> }
  | { type: 'SET_BASIC'; payload: Partial<WeddingEditorBasic> }
  | { type: 'SET_HERO'; payload: Partial<WeddingEditorHero> }
  | { type: 'SET_INVITATION_MESSAGE'; payload: Partial<WeddingEditorInvitationMessage> }
  | { type: 'SET_GROOM'; payload: Partial<WeddingEditorPerson> }
  | { type: 'SET_BRIDE'; payload: Partial<WeddingEditorPerson> }
  | { type: 'SET_GALLERY_IMAGES'; payload: WeddingEditorImage[] }
  | { type: 'SET_LOCATION'; payload: Partial<WeddingEditorLocation> }
  | { type: 'SET_ACCOUNTS'; payload: WeddingEditorAccount[] }
  | { type: 'SET_EXTRAS'; payload: Partial<WeddingEditorExtras> }
  | { type: 'SET_SHARE'; payload: Partial<WeddingEditorShare> };

export type WeddingEditorGalleryState = WeddingEditorGallery;
