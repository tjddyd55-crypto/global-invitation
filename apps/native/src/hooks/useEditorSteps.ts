import { t } from '@/src/i18n';

export type EditorStepKey =
  | 'basic'
  | 'message'
  | 'hero'
  | 'hosts'
  | 'gallery'
  | 'location'
  | 'account'
  | 'rsvp'
  | 'music'
  | 'share';

export type EditorStep = {
  key: EditorStepKey;
  index: number;
  title: string;
};

const STEP_KEYS: EditorStepKey[] = [
  'basic',
  'message',
  'hero',
  'hosts',
  'gallery',
  'location',
  'account',
  'rsvp',
  'music',
  'share',
];

export function getEditorSteps(): EditorStep[] {
  return STEP_KEYS.map((key, index) => ({
    key,
    index,
    title: t(`editor.steps.${key}`),
  }));
}

export const EDITOR_STEP_COUNT = STEP_KEYS.length;
