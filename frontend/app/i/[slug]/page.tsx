'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMusicByKey } from '@/src/constants/music';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';
import { getSharedInvitationBySlug, type Invitation } from '@/src/lib/api';
import { buildAbsolutePublicInvitationUrl, buildPublicInvitationUrlPath } from '@/src/lib/publicInvitation';
import {
  extractSharePresentationFromInvitation,
} from '@/src/lib/invitationShareMeta';
import { trackInvitationView } from '@/src/lib/trackInvitationView';
import ShareFallbackNotice from '@/src/components/ShareFallbackNotice';
import InvitationShareBlock from '@/src/components/share/InvitationShareBlock';
import DesktopPublicSharePanel from '@/src/components/share/DesktopPublicSharePanel';
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

function resolveSafeSlug(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return '';
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
    if (typeof window === 'undefined' || !invitation) return;
    const absolute = buildAbsolutePublicInvitationUrl(window.location.origin, effectiveShareSlug);
    /** 스토리 공유는 요청 URL의 OG/Twitter 메타·동적 OG 이미지(`/i/.../opengraph-image`)를 스크랩한다. */
    window.open(`https://story.kakao.com/share?url=${encodeURIComponent(absolute)}`, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (isSharing || !invitation) return;
    if (typeof window === 'undefined') return;

    setShareFallbackUrl(null);
    setIsSharing(true);
    try {
      const pres = extractSharePresentationFromInvitation(invitation);
      const url = buildAbsolutePublicInvitationUrl(window.location.origin, effectiveShareSlug);
      const shareText = `${pres.metaTitle}\n${pres.metaDescription}`;

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: pres.metaTitle,
          text: pres.metaDescription,
          url,
        });
        markShared();
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
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

  const sharePageUrl =
    typeof window !== 'undefined'
      ? buildAbsolutePublicInvitationUrl(window.location.origin, effectiveShareSlug)
      : buildPublicInvitationUrlPath(effectiveShareSlug);
  const sharePresentation = extractSharePresentationFromInvitation(invitation);
  const baseSlug = invitation.slug;
  return (
    <div className={publicInvitationMobile.pageRoot} data-testid="public-route-root">
      <div className={publicInvitationMobile.layout}>
        <div className={publicInvitationMobile.inviteColumn} data-testid="desktop-invitation-column">
          <div className={publicInvitationMobile.shell} data-testid="public-invitation-shell">
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

            {showRsvp ? <RSVPForm invitationSlug={baseSlug} /> : null}

            <section className={publicInvitationMobile.shareSectionMobile}>
              <InvitationShareBlock
                shareUrl={sharePageUrl}
                title={sharePresentation.metaTitle}
                text={sharePresentation.metaDescription}
              />
              {invitation.musicKey ? (
                <button
                  type="button"
                  onClick={handlePlayMusic}
                  className={`${publicInvitationMobile.shareButton} ${publicInvitationMobile.shareButtonMusic}`}
                >
                  {showPlayButton ? t(I18N_KEYS.fields.playMusic) : '음악 다시 재생'}
                </button>
              ) : null}
            </section>
          </div>
        </div>

        <aside className={publicInvitationMobile.desktopAside}>
          <DesktopPublicSharePanel
            shareUrl={sharePageUrl}
            title={sharePresentation.metaTitle}
            text={sharePresentation.metaDescription}
          />
          {showRsvp ? (
            <div className={publicInvitationMobile.asideHint}>
              <div className={publicInvitationMobile.asideHintTitle}>RSVP 바로가기</div>
              참석 여부를 알려주세요
            </div>
          ) : null}
        </aside>
      </div>

      {shareFallbackUrl ? (
        <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
      ) : null}
    </div>
  );
}
