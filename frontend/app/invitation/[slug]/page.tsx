'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMusicByKey } from '@/src/constants/music';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { logEvent } from '@/src/lib/events';
import { getShareContent } from '@/src/lib/share';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';
import WeddingClassicInvitation from '@/src/templates/weddingClassic/WeddingClassicInvitation';
import {
  type WeddingClassicData,
} from '@/src/templates/weddingClassic/data';
import { resolveInvitationBySlug } from '@/src/lib/resolveInvitationData';
import EditorBackButton from '@/app/_components/EditorBackButton';
import ShareFallbackNotice from '@/src/components/ShareFallbackNotice';
import type { Invitation } from '@/src/lib/api';

const EVENT_TRACKING_ENABLED = false;
let didWarnEventTracking = false;

function trackEvent(payload: Parameters<typeof logEvent>[0]) {
  if (!EVENT_TRACKING_ENABLED) {
    if (!didWarnEventTracking) {
      console.warn('[invitation] Event tracking disabled. See docs/INVITATION_BACKEND_STUB.md');
      didWarnEventTracking = true;
    }
    return;
  }
  void logEvent(payload);
}

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useI18n();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [runtimeDataOverride, setRuntimeDataOverride] = useState<WeddingClassicData | null>(null);
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('draft');
  const [shared, setShared] = useState(false);
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const viewLoggedRef = useRef(false);
  const pageUrl = buildCanonicalUrl(`/invitation/${slug}`);

  useEffect(() => {
    if (!slug) {
      router.replace('/create');
      return;
    }

    setLoading(true);
    setInvitation(null);
    setRuntimeDataOverride(null);
    setPublishStatus('draft');
    setShared(false);
    setShareFallbackUrl(null);
    setIsSharing(false);

    try {
      const resolved = resolveInvitationBySlug(slug);
      setInvitation(resolved.invitation);
      setRuntimeDataOverride(resolved.runtimeData);
      setPublishStatus(resolved.status);
    } catch {
      const fallback = resolveInvitationBySlug('');
      setInvitation(fallback.invitation);
      setRuntimeDataOverride(fallback.runtimeData);
      setPublishStatus('draft');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

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

  const markShared = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  useEffect(() => {
    if (viewLoggedRef.current || loading) return;

    if (invitation) {
      trackEvent({
        eventType: 'invitation_view',
        templateType: 'wedding',
        language,
        pageUrl,
      });
      viewLoggedRef.current = true;
    }
  }, [invitation, loading, language, pageUrl]);

  const handleShare = async () => {
    if (isSharing) return;
    if (!slug) return;

    setShareFallbackUrl(null);
    setIsSharing(true);
    try {
      const { title, description } = getShareContent('wedding', t);
      const url =
        typeof window !== 'undefined'
          ? `${window.location.origin}/invitation/${slug}`
          : buildCanonicalUrl(`/invitation/${slug}`);
      trackEvent({ eventType: 'share_click', templateType: 'wedding', language, pageUrl });
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title, text: description, url });
        markShared();
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        markShared();
      } else {
        setShareFallbackUrl(url);
      }
    } finally {
      setIsSharing(false);
    }
  };

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

  if (!invitation) {
    return null;
  }

  if (publishStatus !== 'published') {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.75rem' }}>아직 공개되지 않은 초대장입니다.</h1>
        <p style={{ color: '#666', marginBottom: '1.2rem' }}>
          편집 화면에서 공개하기를 완료하면 누구나 볼 수 있습니다.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/editor/${slug}`)}
          style={{
            border: 'none',
            background: '#2f6fed',
            color: 'white',
            borderRadius: '999px',
            padding: '0.65rem 1.2rem',
            cursor: 'pointer',
          }}
        >
          편집으로 이동
        </button>
      </div>
    );
  }

  const weddingClassicData = runtimeDataOverride;
  if (!weddingClassicData) return null;

  return (
    <>
      <EditorBackButton fallbackUrl={`/editor/${slug}`} />
      {showPlayButton && invitation.musicKey && (
        <div style={{ position: 'sticky', top: 16, zIndex: 3, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handlePlayMusic}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '999px',
              border: 'none',
              background: '#2f6fed',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {t('playMusic')}
          </button>
        </div>
      )}
      <WeddingClassicInvitation
        data={weddingClassicData}
        invitationSlug={slug}
        showPlayButton={false}
        onShare={handleShare}
        isShared={shared}
      />
      {shareFallbackUrl && (
        <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
      )}
    </>
  );
}
