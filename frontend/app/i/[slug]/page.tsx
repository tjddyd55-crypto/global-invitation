'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMusicByKey } from '@/src/constants/music';
import { getSharedInvitationBySlug, type Invitation } from '@/src/lib/api';
import { buildAbsolutePublicInvitationUrl, buildPublicInvitationUrlPath } from '@/src/lib/publicInvitation';
import {
  extractSharePresentationFromInvitation,
} from '@/src/lib/invitationShareMeta';
import { trackInvitationView } from '@/src/lib/trackInvitationView';
import ShareFallbackNotice from '@/src/components/ShareFallbackNotice';
import InvitationShareBlock from '@/src/components/share/InvitationShareBlock';
import DesktopPublicSharePanel from '@/src/components/share/DesktopPublicSharePanel';
import InvitationMusicPlayer from '@/src/features/invitation/ui/InvitationMusicPlayer';
import { resolvePlayableInvitationMusic } from '@/src/invitation/invitationMusic';
import {
  fetchTemplateDefinitionById,
  getTemplateRegistryEntry,
  getTemplateRenderer,
  type TemplateCategory,
  type TemplateDefinition,
} from '@/src/templates/registry';
import publicInvitationMobile from '@/src/styles/publicInvitationMobile.module.css';
import { resolveInvitationConceptType } from '@/src/invitation/schemas';
import { getInvitationRsvpSettings } from '@/src/invitation/rsvpSettings';
import SafeCreatorRenderer from '@/src/templates/creator/SafeCreatorRenderer';

function resolveSafeSlug(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return '';
}

export default function PublicShareInvitationPage() {
  const params = useParams();
  const shareSlugParam = resolveSafeSlug(params.slug);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [templateDefinition, setTemplateDefinition] = useState<TemplateDefinition | null>(null);
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
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

  const effectiveShareSlug = invitation?.shareSlug?.trim() || shareSlugParam;

  useEffect(() => {
    if (!invitation?.slug || loading) return;
    if (analyticsTrackedSlugRef.current === invitation.slug) return;
    analyticsTrackedSlugRef.current = invitation.slug;
    trackInvitationView(invitation.slug);
  }, [invitation?.slug, loading]);

  const runtimeData = useMemo(() => invitation?.dataJson ?? invitation?.data ?? null, [invitation]);
  const playableMusic = useMemo(
    () =>
      resolvePlayableInvitationMusic(runtimeData, (key) => {
        const track = getMusicByKey(key);
        return track ? { src: track.src, title: track.title } : undefined;
      }),
    [runtimeData]
  );

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
  const rsvpSettings = getInvitationRsvpSettings(runtimeData, conceptType);
  const showRsvp = rsvpSettings.enabled;
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
  const sharePresentation = extractSharePresentationFromInvitation(invitation, {
    canonicalUrl: sharePageUrl.startsWith('http') ? sharePageUrl : undefined,
    siteOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
    purpose: 'share-payload',
  });
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
                }}
                fallbackProps={{
                  data: runtimeData,
                  invitationSlug: baseSlug,
                  showPlayButton: false,
                }}
              />
            ) : isCreatorTemplate && FallbackTemplate ? (
              <FallbackTemplate
                data={runtimeData}
                invitationSlug={baseSlug}
                showPlayButton={false}
              />
            ) : (
              <Template
                data={runtimeData}
                invitationSlug={baseSlug}
                showPlayButton={false}
              />
            )}

            <section className={publicInvitationMobile.shareSectionMobile}>
              <InvitationShareBlock
                shareUrl={sharePageUrl}
                title={sharePresentation.metaTitle}
                text={sharePresentation.metaDescription}
                imageUrl={sharePresentation.imageUrl}
              />
            </section>
          </div>
        </div>

        <aside className={publicInvitationMobile.desktopAside}>
          <DesktopPublicSharePanel
            shareUrl={sharePageUrl}
            title={sharePresentation.metaTitle}
            text={sharePresentation.metaDescription}
            imageUrl={sharePresentation.imageUrl}
          />
          {showRsvp ? (
            <div className={publicInvitationMobile.asideHint}>
              <div className={publicInvitationMobile.asideHintTitle}>RSVP 바로가기</div>
              <button
                type="button"
                className={publicInvitationMobile.asideRsvpButton}
                data-testid="desktop-aside-rsvp-cta"
                onClick={() => {
                  document
                    .querySelector('[data-section-id="rsvp"]')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                {rsvpSettings.buttonLabel}
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      {playableMusic ? <InvitationMusicPlayer music={playableMusic} /> : null}

      {shareFallbackUrl ? (
        <ShareFallbackNotice url={shareFallbackUrl} onClose={() => setShareFallbackUrl(null)} />
      ) : null}
    </div>
  );
}
