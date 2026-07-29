/**
 * Built-in BGM catalog (public FE assets).
 *
 * User-uploaded music uses R2 canonical keys via `uploadMediaAudio` /
 * `invitation/{env}/users/.../music/{uuid}.ext` — not this list.
 *
 * Future shared catalog objects should map here to:
 *   invitation/shared/music/{concept|common}/{fileKey}.ext
 * via Backend `buildSharedAssetKey` (admin/deploy only; not end-user upload).
 */
export interface Music {
  musicKey: string;
  title: string;
  src: string; // public 폴더의 mp3 파일 경로 (또는 향후 shared CDN URL)
}

export const MUSIC_LIST: Music[] = [
  {
    musicKey: 'piano_soft',
    title: 'Piano Soft',
    src: '/music/piano_soft.mp3',
  },
  {
    musicKey: 'piano_wedding',
    title: 'Piano Wedding',
    src: '/music/piano_wedding.mp3',
  },
  {
    musicKey: 'acoustic_guitar',
    title: 'Acoustic Guitar',
    src: '/music/acoustic_guitar.mp3',
  },
];

export const getMusicByKey = (key: string | null | undefined): Music | undefined => {
  if (!key) return undefined;
  return MUSIC_LIST.find((m) => m.musicKey === key);
};
