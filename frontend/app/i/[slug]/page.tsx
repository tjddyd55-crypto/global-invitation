'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMusicByKey } from '@/src/constants/music';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { getSharedInvitationBySlug, type Invitation } from '@/src/lib/api';
import { getShareContent, type ShareTemplateType } from '@/src/lib/share';
import { buildAbsolutePublicInvitationUrl, buildPublicInvitationUrlPath } from '@/src/lib/publicInvitation';
import { trackInvitationView } from '@/src/lib/trackInvitationView';
import ShareFallbackNotice from '@/src/components/ShareFallbackNotice';
import {
  fetchTemplateDefinitionById,
  getTemplateRegistryEntry,
  getTemplateRenderer,
  type TemplateCategory,
  type TemplateDefinition,
} from '@/src/templates/registry';
import RSVPForm from '@/src/components/rsvp/RSVPForm';
import { resolveInvitationConceptType, resolveInvitationRsvpEnabled } from '@/src/invitation/schemas';
import SafeCreatorRenderer from '@/src/templates/creator/SafeCreatorRenderer';

function resolveSafeSlug(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return '';
}

function resolveShareTemplateType(category: TemplateCategory, conceptType: string): ShareTemplateType {
  if (conceptType === 'FUNERAL' || category === 'funeral') return 'funeral';
  return 'wedding';
}

export default function PublicShareInvitationPage() {
  const params = useParams();
  const shareSlugParam = resolveSafeSlug(params.slug);
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [templateDefinition, setTemplateDefinition] = useState<TemplateDefinition | null>(null);
  const [shared, setShared] = useState(false);
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyticsTrackedSlugRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadSharedInvitation() {
      if (!shareSlugParam) {
        setError('유효하지 않은 공유 링크입니다.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const shared = await getSharedInvitationBySlug(shareSlugParam);
        if (!mounted) return;
        setInvitation(shared);
      } catch {
        if (!mounted) return;
        setError('공유 초대장을 불러올 수 없습니다.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    void loadSharedInvitation();
    return () => {
      mounted = false;
    };
  }, [shareSlugParam]);

  const templateId = invitation?.templateId;
  useEffect(() => {
    if (!templateId) {
      setTemplateDefinition(null);
      return;
    }

    let isMounted = true;
    async function loadTemplateDefinition() {
      try {
        const definition = await fetchTemplateDefinitionById(templateId as string);
        if (!isMounted) return;
        setTemplateDefinition(definition);
      } catch {
        if (!isMounted) return;
        setTemplateDefinition(null);
      }
    }

    void loadTemplateDefinition();
    return () => {
      isMounted = false;
    };
  }, [templateId]);

  useEffect(() => {
    if (!invitation?.musicKey) return;

    const music = getMusicByKey(invitation.musicKey);
    if (!music) return;

    const audio = new Audio(music.src);
    audioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setShowPlayButton(false))
        .catch(() => setShowPlayButton(true));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [invitation?.musicKey]);

  const effectiveShareSlug = invitation?.shareSlug?.trim() || shareSlugParam;

  const markShared = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  useEffect(() => {
    if (!invitation?.slug || loading) return;
    if (analyticsTrackedSlugRef.current === invitation.slug) return;
    analyticsTrackedSlugRef.current = invitation.slug;
    trackInvitationView(invitation.slug);
  }, [invitation?.slug, loading]);

  const handlePlayMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        alert(t(I18N_KEYS.notice.audioPlayFailed));
      });
      setShowPlayButton(false);
    }
  };

  const handleKakaoShare = () => {
    if (typeof window === 'undefined') return;
    const absolute = buildAbsolutePublicInvitationUrl(window.location.origin, effectiveShareSlug);
    window.open(`https://story.kakao.com/share?url=${encodeURIComponent(absolute)}`, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (isSharing) return;
    if (typeof window === 'undefined') return;

    setShareFallbackUrl(null);
    setIsSharing(true);
    try {
      const category =
        templateDefinition?.category ||
        getTemplateRegistryEntry(invitation?.templateKey)?.category ||
        'wedding';
      const runtimeData = invitation?.dataJson ?? invitation?.data ?? null;
      const conceptType = resolveInvitationConceptType(runtimeData, invitation?.templateKey);
      const shareKind = resolveShareTemplateType(category, conceptType);
      const { title, description } = getShareContent(shareKind, t);
      const url = buildAbsolutePublicInvitationUrl(window.location.origin, effectiveShareSlug);

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

  const runtimeData = useMemo(() => invitation?.dataJson ?? invitation?.data ?? null, [invitation]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.6rem' }}>초대장을 찾을 수 없습니다.</h1>
        <p style={{ color: '#666' }}>{error || '유효하지 않은 링크입니다.'}</p>
      </div>
    );
  }

  const Template = getTemplateRenderer(invitation.templateKey);
  if (!Template || !runtimeData) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.6rem' }}>렌더링할 수 없는 템플릿입니다.</h1>
        <p style={{ color: '#666' }}>템플릿 설정을 확인해 주세요.</p>
      </div>
    );
  }

  const conceptType = resolveInvitationConceptType(runtimeData, invitation.templateKey);
  const showRsvp = resolveInvitationRsvpEnabled(runtimeData);
  const isCreatorTemplate = /^creator_(wedding|funeral)_[a-z0-9_]+$/.test(invitation.templateKey);
  const hasStudioConfig = Boolean(templateDefinition?.studioConfig);
  const templateCategory =
    templateDefinition?.category || getTemplateRegistryEntry(invitation.templateKey)?.category || 'wedding';

  const fallbackTemplateKey =
    conceptType === 'FUNERAL' || templateCategory === 'funeral' ? 'funeral_classic' : 'invitation_full';
  const FallbackTemplate = getTemplateRenderer(fallbackTemplateKey);

  const baseSlug = invitation.slug;
  return (
    <>
      {isCreatorTemplate && hasStudioConfig && FallbackTemplate ? (
        <SafeCreatorRenderer
          creatorRenderer={Template}
          fallbackRenderer={FallbackTemplate}
          creatorProps={{
            data: runtimeData,
            runtimeData,
            studioConfig: templateDefinition?.studioConfig,
            invitationSlug: baseSlug,
            previewMode: false,
            showPlayButton: false,
            showRsvp: showRsvp ? false : undefined,
          }}
          fallbackProps={{
            data: runtimeData,
            invitationSlug: baseSlug,
            showPlayButton: false,
            showRsvp: showRsvp ? false : undefined,
          }}
        />
      ) : isCreatorTemplate && FallbackTemplate ? (
        <FallbackTemplate
          data={runtimeData}
          invitationSlug={baseSlug}
          showPlayButton={false}
          showRsvp={showRsvp ? false : undefined}
        />
      ) : (
        <Template
          data={runtimeData}
          invitationSlug={baseSlug}
          showPlayButton={false}
          showRsvp={showRsvp ? false : undefined}
        />
      )}

      {showRsvp && (
        <section style={{ maxWidth: '760px', margin: '0 auto', padding: '1rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>참석 여부</h2>
          <RSVPForm invitationSlug={baseSlug} />
        </section>
      )}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '1rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>공유하기</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={handleShare}
            style={{ padding: '0.6rem 1rem', borderRadius: '999px', border: '1px solid #a9ba7a', background: '#a9ba7a', color: 'white' }}
          >
            {shared ? '공유됨' : '공유하기'}
          </button>
          <button
            type="button"
            onClick={handleKakaoShare}
            style={{ padding: '0.6rem 1rem', borderRadius: '999px', border: '1px solid #8a7a6a', background: 'white', color: '#4a433a' }}
          >
            카카오 공유
          </button>
          {invitation.musicKey && (
            <button
              type="button"
              onClick={handlePlayMusic}
              style={{ padding: '0.6rem 1rem', borderRadius: '999px', border: 'none', background: '#2f6fed', color: 'white' }}
            >
              {showPlayButton ? t(I18N_KEYS.fields.playMusic) : '음악 다시 재생'}
            </button>
          )}
        </div>
      </section>
      {shareFallbackUrl && (
        <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
      )}
    </>
  );
}
