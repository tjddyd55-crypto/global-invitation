import type { WeddingEditorAction } from './weddingEditor.reducer.types';
import type { WeddingEditorState } from './weddingEditor.types';

export function weddingEditorReducer(state: WeddingEditorState, action: WeddingEditorAction): WeddingEditorState {
  switch (action.type) {
    case 'REPLACE_STATE':
      return action.payload;
    case 'SET_SETUP':
      return { ...state, setup: { ...state.setup, ...action.payload } };
    case 'SET_BASIC':
      return { ...state, basic: { ...state.basic, ...action.payload } };
    case 'SET_HERO':
      return { ...state, hero: { ...state.hero, ...action.payload } };
    case 'SET_INVITATION_MESSAGE':
      return { ...state, invitationMessage: { ...state.invitationMessage, ...action.payload } };
    case 'SET_GROOM':
      return { ...state, groom: { ...state.groom, ...action.payload } };
    case 'SET_BRIDE':
      return { ...state, bride: { ...state.bride, ...action.payload } };
    case 'SET_GALLERY_IMAGES':
      return { ...state, gallery: { ...state.gallery, images: action.payload } };
    case 'SET_LOCATION':
      return { ...state, location: { ...state.location, ...action.payload } };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_EXTRAS':
      return { ...state, extras: { ...state.extras, ...action.payload } };
    case 'SET_SHARE':
      return { ...state, share: { ...state.share, ...action.payload } };
    default:
      return state;
  }
}
