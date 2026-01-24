import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';
import { getFuneralClassicDemoData } from '@/src/templates/funeralClassic/data';
import type { FuneralEditorState } from './funeralEditor.types';

export function createFuneralEditorState(data?: FuneralInvitation | null): FuneralEditorState {
  const base = data ?? getFuneralClassicDemoData();
  return {
    ...base,
    templateKey: 'funeral_classic',
  };
}
