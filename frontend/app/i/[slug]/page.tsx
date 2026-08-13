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
import { useI18n } from '@/src/contexts/I18nContext';
import { InvitationLocaleProvider } from '@/src/i18n/InvitationLocaleContext';
import { invitationT } from '@/src/i18n/invitationT';
import { htmlLangFromLocale, resolveInvitationProductLocale } from '@/src/i18n/productLocales';

function resolveSafeSlug(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return '';
}

export default function PublicShareInvitationPage() {
  const { t } = useI18n();
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
        setError(t('notFound'));
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
        setError(t('loadFailed'));
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
  }, [shareSlugParam, t]);

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

  const invitationLocale = resolveInvitationProductLocale({
    language: invitation?.language,
    dataJson: invitation?.dataJson,
    data: invitation?.data,
  });

  useEffect(() => {
    if (!invitation) return;
    const previous = document.documentElement.lang;
    document.documentElement.lang = htmlLangFromLocale(invitationLocale);
    return () => {
      document.documentElement.lang = previous;
    };
  }, [invitation, invitationLocale]);

  const runtimeData = useMemo(() => {
    const raw = invitation?.dataJson ?? invitation?.data ?? null;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    return { ...(raw as Record<string, unknown>), locale: invitationLocale, language: invitationLocale };
  }, [invitation, invitationLocale]);
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
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.6rem' }}>{t('notFound')}</h1>
        <p style={{ color: '#666' }}>{error || t('notFound')}</p>
      </div>
    );
  }

  const Template = getTemplateRenderer(invitation.templateKey);
  if (!Template || !runtimeData) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.6rem' }}>{t('error')}</h1>
        <p style={{ color: '#666' }}>{t('loadFailed')}</p>
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
    <InvitationLocaleProvider locale={invitationLocale}>
    <div className={publicInvitationMobile.pageRoot} data-testid="public-route-root">
      <div className={publicInvitationMobile.layout}>
        <div className={publicInvitationMobile.inviteColumn} data-testid="desktop-invitation-column">
          <div
            className={publicInvitationMobile.shell}
            data-testid="public-invitation-shell"
            data-invitation-locale={invitationLocale}
            lang={htmlLangFromLocale(invitationLocale)}
          >
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
              <div className={publicInvitationMobile.asideHintTitle}>
                {invitationT(invitationLocale, 'invitation.rsvp.asideTitle')}
              </div>
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
    </InvitationLocaleProvider>
  );
}
