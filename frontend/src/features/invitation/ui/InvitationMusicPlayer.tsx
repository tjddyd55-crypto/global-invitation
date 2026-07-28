'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useRef, useState } from 'react';
import type { ResolvedInvitationMusic } from '@/src/invitation/invitationMusic';
import styles from './InvitationMusicPlayer.module.css';

type InvitationMusicPlayerProps = {
  music: ResolvedInvitationMusic;
};

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/**
 * 공개/프리뷰 공통 배경 음악 — 사용자 클릭 후에만 play.
 * 자동재생·muted 우회 없음.
 */
export default function InvitationMusicPlayer({ music }: InvitationMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');

  useEffect(() => {
    const audio = new Audio(music.src);
    audio.loop = music.loop;
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onPlaying = () => setStatus('playing');
    const onPause = () => setStatus((prev) => (prev === 'error' ? prev : 'paused'));
    const onWaiting = () => setStatus('loading');
    const onError = () => setStatus('error');

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [music.src, music.loop]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
      return;
    }

    try {
      setStatus('loading');
      if (music.startAtSeconds > 0 && audio.currentTime < 0.5) {
        audio.currentTime = music.startAtSeconds;
      }
      await audio.play();
      setStatus('playing');
    } catch {
      setStatus('error');
    }
  };

  const label =
    status === 'playing'
      ? '배경 음악 일시정지'
      : status === 'loading'
        ? '배경 음악 로딩'
        : status === 'error'
          ? '배경 음악 재생 오류'
          : '배경 음악 재생';

  return (
    <button
      type="button"
      className={`${styles.fab} ${status === 'playing' ? styles.fabPlaying : ''} ${status === 'error' ? styles.fabError : ''}`}
      onClick={() => void toggle()}
      aria-label={label}
      title={music.title}
      data-testid="invitation-music-player"
      data-music-status={status}
    >
      {status === 'loading' ? '…' : status === 'playing' ? '❚❚' : status === 'error' ? '!' : '♪'}
    </button>
  );
}
