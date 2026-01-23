'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getInvitation } from '@/src/lib/api';
import type { Invitation } from '@/src/lib/api';
import { getMusicByKey } from '@/src/constants/music';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS, type I18nKey } from '@/src/i18n';

export default function InvitationPage() {
  const params = useParams();
  const { t, language } = useI18n();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<I18nKey | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadInvitation() {
      try {
        const data = await getInvitation(slug);
        setInvitation(data);
      } catch (err) {
        const isNotFound = err instanceof Error && err.message === 'Invitation not found';
        setError(isNotFound ? I18N_KEYS.common.notFound : I18N_KEYS.notice.loadFailed);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadInvitation();
    }
  }, [slug]);

  // 음악 자동 재생 시도
  useEffect(() => {
    if (!invitation?.musicKey) return;

    const music = getMusicByKey(invitation.musicKey);
    if (!music) return;

    const audio = new Audio(music.src);
    audioRef.current = audio;

    // 자동 재생 시도
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // 자동 재생 성공
          setShowPlayButton(false);
        })
        .catch(() => {
          // 자동 재생 실패 (브라우저 정책)
          setShowPlayButton(true);
        });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [invitation?.musicKey]);

  const handlePlayMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        alert(t(I18N_KEYS.notice.audioPlayFailed));
      });
      setShowPlayButton(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>{t('notFound')}</h1>
        <p style={{ color: 'red' }}>{t(error)}</p>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const locale = language === 'ko' ? 'ko-KR' : language === 'mn' ? 'mn-MN' : 'en-US';
      return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const hasContent = invitation.title || invitation.message || invitation.eventDate || invitation.locationText;

  const handleShare = async () => {
    if (!invitation) return;

    if (!invitation.canShare) {
      alert(t('paymentRequired'));
      return;
    }

    // can_share === true 인 경우 URL 복사
    const invitationUrl = `${window.location.origin}/invitation/${invitation.slug}`;
    
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard API가 지원되지 않는 경우 fallback
      const textArea = document.createElement('textarea');
      textArea.value = invitationUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert(t('copyFailed'));
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '2rem', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {invitation.title ? (
          <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>
            {invitation.title}
          </h1>
        ) : (
          <h1 style={{ marginBottom: '2rem', fontSize: '2rem', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
            {t('invitation')}
          </h1>
        )}

        {invitation.message ? (
          <div style={{ marginBottom: '2rem', fontSize: '1.2rem', lineHeight: '2', color: '#444', textAlign: 'center' }}>
            {invitation.message.split('\n').map((line, index) => (
              <p key={index} style={{ marginBottom: '1rem' }}>
                {line || '\u00A0'}
              </p>
            ))}
          </div>
        ) : hasContent ? null : (
          <div style={{ marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.8', color: '#999', textAlign: 'center', fontStyle: 'italic' }}>
            {t('pleaseEnterContent')}
          </div>
        )}

        {(invitation.eventDate || invitation.locationText) && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #eee' }}>
            {invitation.eventDate && (
              <div style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
                <strong style={{ color: '#666', display: 'block', marginBottom: '0.25rem' }}>{t('eventDate')}</strong>
                <span style={{ color: '#333' }}>{formatDate(invitation.eventDate)}</span>
              </div>
            )}

            {invitation.locationText && (
              <div style={{ fontSize: '1.1rem' }}>
                <strong style={{ color: '#666', display: 'block', marginBottom: '0.25rem' }}>{t('location')}</strong>
                <span style={{ color: '#333' }}>{invitation.locationText}</span>
              </div>
            )}
          </div>
        )}

        {showPlayButton && invitation.musicKey && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={handlePlayMusic}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              {t('playMusic')}
            </button>
          </div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={handleShare}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: invitation.canShare ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {copied ? t('shared') : t('share')}
          </button>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
          <p style={{ margin: '0.25rem 0' }}>{t('invitationIdLabel')} {invitation.id}</p>
          <p style={{ margin: '0.25rem 0' }}>{t('slugLabel')} {invitation.slug}</p>
          <p style={{ margin: '0.25rem 0' }}>{t('createdLabel')} {formatDate(invitation.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
