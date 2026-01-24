import type { MessageCardActions, MessageCardData, MessageCardTheme } from '@/src/models/messageCard';

export type MessageCardEditorState = MessageCardData;

export type MessageCardEditorAction =
  | { type: 'SET_FIELDS'; payload: Partial<Omit<MessageCardData, 'actions'>> }
  | { type: 'SET_ACTIONS'; payload: Partial<MessageCardActions> }
  | { type: 'SET_THEME'; payload: MessageCardTheme | undefined };
