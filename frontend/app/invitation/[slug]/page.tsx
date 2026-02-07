'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Invitation } from '@/src/lib/api';
import { getMusicByKey } from '@/src/constants/music';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { formatDateTime } from '@/src/lib/i18n/format';
import { logEvent } from '@/src/lib/events';
import { buildShareUrl, getShareContent, shareLink, type ShareTemplateType } from '@/src/lib/share';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';
import WeddingClassicInvitation from '@/src/templates/weddingClassic/WeddingClassicInvitation';
import {
  buildWeddingClassicData,
  getWeddingClassicDemoInvitation,
  isWeddingClassicDemoSlug,
  getSampleWeddingInvitation,
  isSampleWeddingSlug,
  isWeddingClassicTemplate,
} from '@/src/templates/weddingClassic/data';
import FuneralClassicInvitation from '@/src/templates/funeralClassic/FuneralClassicInvitation';
import {
  getFuneralClassicDemoData,
  isFuneralClassicDemoSlug,
  isFuneralClassicTemplate,
} from '@/src/templates/funeralClassic/data';
import EditorBackButton from '@/app/_components/EditorBackButton';
import ShareFallbackNotice from '@/src/components/ShareFallbackNotice';
import PaymentButton from '@/src/components/PaymentButton';
import { canAccessPaidAction, notifyPaymentRequired } from '@/src/lib/payments';
import { ensureGuestToken, getStoredSession } from '@/src/lib/auth';

type InvitationErrorState = 'not_found' | 'server_error';

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
  const [errorState, setErrorState] = useState<InvitationErrorState | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [funeralData, setFuneralData] = useState<ReturnType<typeof getFuneralClassicDemoData> | null>(null);
  const [shared, setShared] = useState(false);
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const publishing = false;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const viewLoggedRef = useRef(false);
  const pageUrl = buildCanonicalUrl(`/invitation/${slug}`);
  const isSampleWedding = isSampleWeddingSlug(slug);
  const isDemo = isWeddingClassicDemoSlug(slug) || isFuneralClassicDemoSlug(slug) || isSampleWedding;

  useEffect(() => {
    ensureGuestToken();
    setHasSession(Boolean(getStoredSession()));
  }, []);

  useEffect(() => {
    if (!slug) {
      router.replace('/create');
      return;
    }

    setLoading(true);
    setErrorState(null);
    setInvitation(null);
    setFuneralData(null);
    setShared(false);
    setShareFallbackUrl(null);
    setIsSharing(false);

    try {
      if (isSampleWedding) {
        setInvitation(getSampleWeddingInvitation());
        return;
      }
      if (isFuneralClassicDemoSlug(slug)) {
        setFuneralData(getFuneralClassicDemoData());
        return;
      }
      if (isWeddingClassicDemoSlug(slug)) {
        setInvitation(getWeddingClassicDemoInvitation());
        return;
      }

      console.warn('[invitation] Backend fetch disabled. See docs/INVITATION_BACKEND_STUB.md');
      setErrorState('not_found');
    } catch {
      setErrorState('server_error');
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

  const resolveTemplateType = (templateKey?: string | null): ShareTemplateType => {
    if (!templateKey) return 'wedding';
    if (isFuneralClassicTemplate(templateKey)) return 'funeral';
    if (isWeddingClassicTemplate(templateKey)) return 'wedding';
    return 'message';
  };

  useEffect(() => {
    if (viewLoggedRef.current || loading) return;

    if (funeralData) {
      trackEvent({ eventType: 'invitation_view', templateType: 'funeral', language, pageUrl });
      viewLoggedRef.current = true;
      return;
    }

    if (invitation) {
      trackEvent({
        eventType: 'invitation_view',
        templateType: resolveTemplateType(invitation.templateKey),
        language,
        pageUrl,
      });
      viewLoggedRef.current = true;
    }
  }, [funeralData, invitation, loading, language, pageUrl]);

  const handleShareAction = async (templateType: ShareTemplateType, path: string) => {
    if (isSharing) return;
    if (invitation && !isDemo) {
      if (!invitation.isOwner) {
        alert('소유자만 공유할 수 있습니다.');
        return;
      }
      if (!hasSession) {
        alert('공유하려면 로그인이 필요합니다.');
        return;
      }
      if (!canAccessPaidAction({ product: 'invitation', isPaid: invitation.isPaid, canShare: invitation.canShare })) {
        notifyPaymentRequired(t);
        return;
      }
    }

    setShareFallbackUrl(null);
    setIsSharing(true);
    try {
      trackEvent({ eventType: 'share_click', templateType, language, pageUrl });

      const { title, description } = getShareContent(templateType, t);
      const url = buildShareUrl(path);
      const result = await shareLink({ url, title, text: description });

      if (result === 'shared' || result === 'copied') {
        markShared();
        return;
      }

      if (result === 'manual') {
        setShareFallbackUrl(url);
        return;
      }

      if (result === 'failed') {
        alert(t(I18N_KEYS.notice.copyFailed));
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

  const handlePublish = async () => {
    alert('현재 단계에서는 배포 기능이 비활성화되어 있습니다.');
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (errorState) {
    const heading =
      errorState === 'server_error' ? t(I18N_KEYS.common.error) : t(I18N_KEYS.common.notFound);
    const message =
      errorState === 'server_error' ? t(I18N_KEYS.notice.temporaryError) : t(I18N_KEYS.common.notFound);

    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>{heading}</h1>
        <p style={{ color: 'red' }}>{message}</p>
      </div>
    );
  }

  if (funeralData) {
    const handleKakaoShare = () => {
      trackEvent({ eventType: 'share_click', templateType: 'funeral', language, pageUrl });
      alert(t(I18N_KEYS.notice.kakaoShareUnavailable));
    };

    return (
      <>
        <EditorBackButton fallbackUrl={`/editor/${slug}`} />
        <FuneralClassicInvitation
          data={funeralData}
          onShare={() => handleShareAction('funeral', `/invitation/${slug}`)}
          isShared={shared}
          onKakaoShare={handleKakaoShare}
        />
        {shareFallbackUrl && (
          <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
        )}
      </>
    );
  }

  if (!invitation) {
    return null;
  }

  if (isWeddingClassicTemplate(invitation.templateKey)) {
    const weddingClassicData = buildWeddingClassicData(invitation, language);
    return (
      <>
        <EditorBackButton fallbackUrl={`/editor/${slug}`} />
        <WeddingClassicInvitation
          data={weddingClassicData}
          invitationSlug={slug}
          showPlayButton={showPlayButton}
          onPlayMusic={handlePlayMusic}
          onShare={() => handleShareAction('wedding', `/invitation/${slug}`)}
          isShared={shared}
        />
        {shareFallbackUrl && (
          <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
        )}
      </>
    );
  }

  if (isFuneralClassicTemplate(invitation.templateKey)) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>부고장 템플릿은 demo-funeral-classic에서 확인할 수 있습니다.</h1>
        <p>실제 데이터 연동은 다음 단계에서 진행됩니다.</p>
      </div>
    );
  }

  const formatDateValue = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return Number.isNaN(date.getTime()) ? dateString : formatDateTime(language, date);
    } catch {
      return dateString;
    }
  };

  const hasContent = invitation.title || invitation.message || invitation.eventDate || invitation.locationText;
  const handleShare = () => {
    handleShareAction(resolveTemplateType(invitation.templateKey), `/invitation/${invitation.slug}`);
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
                <span style={{ color: '#333' }}>{formatDateValue(invitation.eventDate)}</span>
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
            {shared ? t(I18N_KEYS.common.shared) : t(I18N_KEYS.common.share)}
          </button>
          {invitation.isOwner && hasSession && invitation.status !== 'published' && (
            <div style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                style={{
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.95rem',
                  backgroundColor: '#2f6fed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {publishing ? '배포 중...' : '배포하기'}
              </button>
            </div>
          )}
          {!invitation.canShare && invitation.isOwner && (
            <div style={{ marginTop: '0.75rem' }}>
              <PaymentButton product="invitation" />
            </div>
          )}
        </div>
        {shareFallbackUrl && (
          <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
        )}

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
          <p style={{ margin: '0.25rem 0' }}>{t('invitationIdLabel')} {invitation.id}</p>
          <p style={{ margin: '0.25rem 0' }}>{t('slugLabel')} {invitation.slug}</p>
          <p style={{ margin: '0.25rem 0' }}>{t('createdLabel')} {formatDateValue(invitation.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
