import type { FuneralEditorAction, FuneralEditorState } from './funeralEditor.types';

export function funeralEditorReducer(state: FuneralEditorState, action: FuneralEditorAction): FuneralEditorState {
  switch (action.type) {
    case 'SET_BASIC':
      return { ...state, ...action.payload };
    case 'SET_MESSAGE':
      return { ...state, message: action.payload.message };
    case 'SET_FAMILY':
      return { ...state, chiefMourner: action.payload.chiefMourner, familyMembers: action.payload.familyMembers };
    case 'SET_SCHEDULE':
      return { ...state, schedule: action.payload };
    case 'SET_HALL':
      return { ...state, funeralHall: action.payload };
    case 'SET_CONTACT':
      return { ...state, contact: action.payload };
    default:
      return state;
  }
}
