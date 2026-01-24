import type { MessageCardData } from '@/src/models/messageCard';
import { getMessageCardDemoData } from '@/src/templates/messageThankYou/data';
import type { MessageCardEditorState } from './messageCardEditor.types';

const DEFAULT_ACTIONS = {
  calendar: true,
  copyLink: true,
  kakaoShare: true,
};

export function createMessageCardEditorState(data?: MessageCardData | null): MessageCardEditorState {
  const base = data ?? getMessageCardDemoData();
  return {
    ...base,
    actions: {
      ...DEFAULT_ACTIONS,
      ...base.actions,
    },
  };
}
