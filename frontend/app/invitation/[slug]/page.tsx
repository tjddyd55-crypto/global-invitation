'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMusicByKey } from '@/src/constants/music';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { logEvent } from '@/src/lib/events';
import { getShareContent, type ShareTemplateType } from '@/src/lib/share';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';
import { buildPublicInvitationUrlPath } from '@/src/lib/publicInvitation';
import { resolveInvitationBySlug } from '@/src/lib/resolveInvitationData';
import EditorBackButton from '@/app/_components/EditorBackButton';
import ShareFallbackNotice from '@/src/components/ShareFallbackNotice';
import InvitationMusicPlayer from '@/src/features/invitation/ui/InvitationMusicPlayer';
import { resolvePlayableInvitationMusic } from '@/src/invitation/invitationMusic';
import type { Invitation } from '@/src/lib/api';
import {
  fetchTemplateDefinitionById,
  getTemplateRegistryEntry,
  getTemplateRenderer,
  type TemplateCategory,
  type TemplateDefinition,
} from '@/src/templates/registry';
import RSVPForm from '@/src/components/rsvp/RSVPForm';
import publicInvitationMobile from '@/src/styles/publicInvitationMobile.module.css';
import { resolveInvitationConceptType, resolveInvitationRsvpEnabled } from '@/src/invitation/schemas';
import SafeCreatorRenderer from '@/src/templates/creator/SafeCreatorRenderer';

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

function resolveShareTemplateType(category: TemplateCategory, conceptType: string): ShareTemplateType {
  if (conceptType === 'FUNERAL' || category === 'funeral') return 'funeral';
  return 'wedding';
}

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useI18n();
  const slugParam = params.slug;
  const slug = typeof slugParam === 'string' ? slugParam : Array.isArray(slugParam) ? slugParam[0] : '';

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [runtimeDataOverride, setRuntimeDataOverride] = useState<unknown | null>(null);
  const [templateDefinition, setTemplateDefinition] = useState<TemplateDefinition | null>(null);
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('draft');
  const [shared, setShared] = useState(false);
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const viewLoggedRef = useRef(false);
  const pageUrl = buildCanonicalUrl(`/invitation/${slug}`);

  useEffect(() => {
    if (!slug) {
      router.replace('/templates');
      return;
    }

    setLoading(true);
    setInvitation(null);
    setRuntimeDataOverride(null);
    setTemplateDefinition(null);
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

  /** 공개된 초대장은 공식 경로 /i/{shareSlug}로만 조회·통계를 맞춘다. 로컬 초대장에 shareSlug가 있을 때만 리다이렉트. */
  useEffect(() => {
    if (loading || !slug) return;
    if (publishStatus !== 'published') return;
    const share = invitation?.shareSlug?.trim();
    if (share) {
      router.replace(buildPublicInvitationUrlPath(share));
    }
  }, [loading, slug, publishStatus, invitation?.shareSlug, router]);

  useEffect(() => {
    const templateId = invitation?.templateId;
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
  }, [invitation?.templateId]);

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
      const category =
        templateDefinition?.category || getTemplateRegistryEntry(invitation?.templateKey)?.category || 'wedding';
      const runtimeData = runtimeDataOverride ?? invitation?.dataJson ?? invitation?.data ?? null;
      const conceptType = resolveInvitationConceptType(runtimeData, invitation?.templateKey);
      const shareKind = resolveShareTemplateType(category, conceptType);
      const { title, description } = getShareContent(shareKind, t);
      const publicShare = invitation?.shareSlug?.trim();
      const path = publicShare ? buildPublicInvitationUrlPath(publicShare) : `/invitation/${slug}`;
      const url =
        typeof window !== 'undefined' ? `${window.location.origin}${path}` : buildCanonicalUrl(path);
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

  const handleKakaoShare = () => {
    if (typeof window === 'undefined' || !slug) return;
    const publicShare = invitation?.shareSlug?.trim();
    const path = publicShare ? buildPublicInvitationUrlPath(publicShare) : `/invitation/${slug}`;
    const absolute = `${window.location.origin}${path}`;
    window.open(`https://story.kakao.com/share?url=${encodeURIComponent(absolute)}`, '_blank', 'noopener,noreferrer');
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

  const Template = getTemplateRenderer(invitation.templateKey);
  if (!runtimeDataOverride || !Template) {
    return null;
  }

  const conceptType = resolveInvitationConceptType(runtimeDataOverride, invitation.templateKey);
  const shouldRenderGuestRsvp = resolveInvitationRsvpEnabled(runtimeDataOverride);
  const isCreatorTemplate = /^creator_(wedding|funeral)_[a-z0-9_]+$/.test(invitation.templateKey);
  const hasStudioConfig = Boolean(templateDefinition?.studioConfig);
  const templateCategory =
    templateDefinition?.category || getTemplateRegistryEntry(invitation.templateKey)?.category || 'wedding';

  const fallbackTemplateKey =
    conceptType === 'FUNERAL' || templateCategory === 'funeral' ? 'funeral_classic' : 'invitation_full';
  const FallbackTemplate = getTemplateRenderer(fallbackTemplateKey);
  const playableMusic = resolvePlayableInvitationMusic(runtimeDataOverride, (key) => {
    const track = getMusicByKey(key);
    return track ? { src: track.src, title: track.title } : undefined;
  });

  return (
    <>
      <EditorBackButton fallbackUrl={`/editor/${slug}`} />
      <div className={publicInvitationMobile.shell}>
      {isCreatorTemplate && hasStudioConfig && FallbackTemplate ? (
        <SafeCreatorRenderer
          creatorRenderer={Template}
          fallbackRenderer={FallbackTemplate}
          creatorProps={{
            data: runtimeDataOverride,
            runtimeData: runtimeDataOverride,
            studioConfig: templateDefinition?.studioConfig,
            invitationSlug: slug,
            previewMode: false,
            showPlayButton: false,
            showRsvp: shouldRenderGuestRsvp ? false : undefined,
          }}
          fallbackProps={{
            data: runtimeDataOverride,
            invitationSlug: slug,
            showPlayButton: false,
            showRsvp: shouldRenderGuestRsvp ? false : undefined,
          }}
        />
      ) : isCreatorTemplate && FallbackTemplate ? (
        <FallbackTemplate
          data={runtimeDataOverride}
          invitationSlug={slug}
          showPlayButton={false}
          showRsvp={shouldRenderGuestRsvp ? false : undefined}
        />
      ) : (
        <Template
          data={runtimeDataOverride}
          invitationSlug={slug}
          showPlayButton={false}
          showRsvp={shouldRenderGuestRsvp ? false : undefined}
        />
      )}
      {shouldRenderGuestRsvp ? <RSVPForm invitationSlug={slug} /> : null}
      <section className={publicInvitationMobile.shareSection}>
        <h2 className={publicInvitationMobile.shareTitle}>공유하기</h2>
        <div className={publicInvitationMobile.shareStack}>
          <button type="button" onClick={handleShare} className={publicInvitationMobile.shareButton}>
            {shared ? '공유됨' : '공유하기'}
          </button>
          <button
            type="button"
            onClick={handleKakaoShare}
            className={`${publicInvitationMobile.shareButton} ${publicInvitationMobile.shareButtonSecondary}`}
          >
            카카오 공유
          </button>
        </div>
      </section>
      {playableMusic ? <InvitationMusicPlayer music={playableMusic} /> : null}
      {shareFallbackUrl ? (
        <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
      ) : null}
      </div>
    </>
  );
}
