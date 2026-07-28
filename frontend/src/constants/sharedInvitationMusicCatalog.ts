/**
 * Shared invitation music catalog — files live under invitation/shared/music/...
 * License fields are required before registering a new track.
 */
export type SharedInvitationMusic = {
  key: string;
  title: string;
  concept: 'wedding' | 'funeral' | 'general' | 'common';
  /** R2 object key without env prefix */
  objectKey: string;
  /** Local/public fallback while R2 shared files are staged */
  localSrc?: string;
  attribution?: string;
  licenseUrl?: string;
  active: boolean;
  sortOrder: number;
};

export const SHARED_INVITATION_MUSIC_CATALOG: SharedInvitationMusic[] = [
  {
    key: 'piano_soft',
    title: 'Piano Soft',
    concept: 'wedding',
    objectKey: 'invitation/shared/music/wedding/piano_soft.mp3',
    localSrc: '/music/piano_soft.mp3',
    attribution: 'Internal catalog placeholder — replace with licensed track metadata',
    active: true,
    sortOrder: 1,
  },
  {
    key: 'piano_wedding',
    title: 'Piano Wedding',
    concept: 'wedding',
    objectKey: 'invitation/shared/music/wedding/piano_wedding.mp3',
    localSrc: '/music/piano_wedding.mp3',
    attribution: 'Internal catalog placeholder — replace with licensed track metadata',
    active: true,
    sortOrder: 2,
  },
  {
    key: 'acoustic_guitar',
    title: 'Acoustic Guitar',
    concept: 'common',
    objectKey: 'invitation/shared/music/common/acoustic_guitar.mp3',
    localSrc: '/music/acoustic_guitar.mp3',
    attribution: 'Internal catalog placeholder — replace with licensed track metadata',
    active: true,
    sortOrder: 3,
  },
];
