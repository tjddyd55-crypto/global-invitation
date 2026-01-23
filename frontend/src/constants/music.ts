export interface Music {
  musicKey: string;
  title: string;
  src: string; // public 폴더의 mp3 파일 경로
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
