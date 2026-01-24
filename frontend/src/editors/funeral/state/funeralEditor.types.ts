import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';

export type FuneralEditorState = FuneralInvitation;

export type FuneralEditorAction =
  | { type: 'SET_BASIC'; payload: Pick<FuneralInvitation, 'deceasedName' | 'birthDate' | 'deathDate' | 'heroImage'> }
  | { type: 'SET_MESSAGE'; payload: Pick<FuneralInvitation, 'message'> }
  | { type: 'SET_FAMILY'; payload: Pick<FuneralInvitation, 'chiefMourner' | 'familyMembers'> }
  | { type: 'SET_SCHEDULE'; payload: FuneralInvitation['schedule'] }
  | { type: 'SET_HALL'; payload: FuneralInvitation['funeralHall'] }
  | { type: 'SET_CONTACT'; payload: FuneralInvitation['contact'] | undefined };
