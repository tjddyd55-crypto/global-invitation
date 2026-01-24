import type { MessageCardEditorAction, MessageCardEditorState } from './messageCardEditor.types';

export function messageCardEditorReducer(
  state: MessageCardEditorState,
  action: MessageCardEditorAction
): MessageCardEditorState {
  switch (action.type) {
    case 'SET_FIELDS':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_ACTIONS':
      return {
        ...state,
        actions: {
          ...state.actions,
          ...action.payload,
        },
      };
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };
    default:
      return state;
  }
}
