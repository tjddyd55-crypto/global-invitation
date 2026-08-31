'use client';
/* eslint-disable i18next/no-literal-string */

import LocationMapSection from '@/src/templates/shared/LocationMapSection';
import InvitationRsvpSection from '@/src/templates/shared/InvitationRsvpSection';
import InvitationAccountsSection from '@/src/templates/shared/InvitationAccountsSection';
import InvitationGallerySection from '@/src/templates/shared/InvitationGallerySection';
import { buildTemplateInvitationModel } from '@/src/templates/shared/templateInvitationModel';
import type { WeddingInvitationData } from '@/src/invitation/schemas';
import ImageWithFallback from '@/src/components/media/ImageWithFallback';
import {
  resolveFieldValue,
  resolveGalleryImages,
  resolveHeroImage,
  styleToCss,
} from './bindings';
import {
  COPY_FALLBACKS,
  type DefinitionNode,
  type DefinitionSection,
  type TemplateDefinition,
} from './types';
import type { InvitationRenderMode } from '@/src/templates/visualTemplate/visualTemplateRegistry';
import styles from './DefinitionTemplateRenderer.module.css';

export type DefinitionTemplateRendererProps = {
  definition: TemplateDefinition;
  data: Record<string, unknown>;
  invitationSlug?: string;
  previewMode?: boolean;
  renderMode?: InvitationRenderMode;
  showRsvp?: boolean;
  showComments?: boolean;
  viewport?: 'mobile' | 'desktop';
};

function resolveCopy(
  key: keyof typeof COPY_FALLBACKS | undefined,
  data: Record<string, unknown>
): string {
  if (!key) return '';
  const locale = String(data.language || data.locale || 'ko-KR').toLowerCase();
  const entry = COPY_FALLBACKS[key];
  return locale.startsWith('en') ? entry.en : entry.ko;
}

function NodeView({
  node,
  data,
  invitationSlug,
  previewMode,
  galleryImages,
}: {
  node: DefinitionNode;
  data: Record<string, unknown>;
  invitationSlug?: string;
  previewMode?: boolean;
  galleryImages: string[];
}) {
  const css = styleToCss(node.style as Record<string, unknown> | undefined);

  if (node.type === 'FIELD' && node.binding) {
    const value = resolveFieldValue(node.binding, data) || node.fallbackText || '';
    return (
      <p style={css} data-gi-field={node.binding}>
        {value}
      </p>
    );
  }

  if (node.type === 'TEXT') {
    return (
      <p style={css} data-gi-text>
        {node.text || ''}
      </p>
    );
  }

  if (node.type === 'COPY') {
    return (
      <h2 style={css} data-gi-copy={node.copyKey}>
        {resolveCopy(node.copyKey, data)}
      </h2>
    );
  }

  if (node.type === 'IMAGE') {
    const src =
      node.media === 'HERO_IMAGE'
        ? resolveHeroImage(data) || node.assetUrl || ''
        : node.media === 'GALLERY_IMAGE'
          ? galleryImages[0] || node.assetUrl || ''
          : node.assetUrl || '';
    return (
      <div style={css} data-gi-media={node.media || 'DECOR'}>
        <ImageWithFallback
          src={src}
          alt={node.alt || ''}
          className={styles.mediaImg}
          fallback={<div className={styles.mediaFallback}>{node.alt || 'image'}</div>}
        />
      </div>
    );
  }

  if (node.type === 'REPEAT' && node.repeatOf === 'GALLERY') {
    const model = buildTemplateInvitationModel(data as WeddingInvitationData);
    return (
      <div style={css} data-gi-repeat="GALLERY">
        <InvitationGallerySection items={model.gallery.items} displayMode={model.gallery.displayMode} />
      </div>
    );
  }

  if (node.type === 'COMPONENT') {
    if (node.component === 'MAP') {
      return (
        <div style={css} data-gi-component="MAP">
          <LocationMapSection
            title={String(data.venueName || data.locationText || '')}
            address={String(data.address || '')}
            detailAddress={String(data.detailAddress || data.venueDetail || '')}
            mapLat={typeof data.mapLat === 'number' ? data.mapLat : undefined}
            mapLng={typeof data.mapLng === 'number' ? data.mapLng : undefined}
            googlePlaceId={typeof data.googlePlaceId === 'string' ? data.googlePlaceId : undefined}
            previewMode={previewMode}
            invitationData={data}
          />
        </div>
      );
    }
    if (node.component === 'RSVP') {
      return (
        <div style={css} data-gi-component="RSVP">
          <InvitationRsvpSection
            data={data}
            invitationSlug={invitationSlug}
            previewMode={previewMode}
            conceptType={String(data.conceptType || 'WEDDING')}
          />
        </div>
      );
    }
    if (node.component === 'ACCOUNT') {
      return (
        <div style={css} data-gi-component="ACCOUNT">
          <InvitationAccountsSection
            accounts={data.accounts}
            conceptType={String(data.conceptType || 'WEDDING')}
          />
        </div>
      );
    }
    return (
      <div style={css} data-gi-component={node.component}>
        {/* Unsupported component placeholder */}
      </div>
    );
  }

  if (node.type === 'DECORATION') {
    return (
      <div style={css} data-gi-decor aria-hidden>
        {node.assetUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.assetUrl} alt="" />
        ) : (
          node.text || null
        )}
      </div>
    );
  }

  return (
    <div style={css} data-gi-container={node.id}>
      {(node.children || []).map((child) => (
        <NodeView
          key={child.id}
          node={child}
          data={data}
          invitationSlug={invitationSlug}
          previewMode={previewMode}
          galleryImages={galleryImages}
        />
      ))}
    </div>
  );
}

function SectionView({
  section,
  data,
  invitationSlug,
  previewMode,
  galleryImages,
}: {
  section: DefinitionSection;
  data: Record<string, unknown>;
  invitationSlug?: string;
  previewMode?: boolean;
  galleryImages: string[];
}) {
  return (
    <section
      style={styleToCss(section.style as Record<string, unknown> | undefined)}
      data-gi-section={section.id}
      aria-label={section.id}
    >
      {(section.nodes || []).map((node) => (
        <NodeView
          key={node.id}
          node={node}
          data={data}
          invitationSlug={invitationSlug}
          previewMode={previewMode}
          galleryImages={galleryImages}
        />
      ))}
    </section>
  );
}

/**
 * Renders a TemplateDefinition using whitelist bindings + existing functional components.
 */
export default function DefinitionTemplateRenderer({
  definition,
  data,
  invitationSlug,
  previewMode,
  viewport = 'mobile',
}: DefinitionTemplateRendererProps) {
  const galleryImages = resolveGalleryImages(data);
  const sections =
    viewport === 'desktop' && definition.desktop?.sections?.length
      ? definition.desktop.sections
      : definition.mobile.sections;

  const maxWidth =
    viewport === 'desktop'
      ? definition.desktop?.width || 960
      : definition.mobile.width || 390;

  return (
    <article
      className={styles.root}
      data-testid="definition-template-renderer"
      data-template-key={definition.templateKey}
      data-source={definition.source.type}
      style={{
        maxWidth,
        margin: '0 auto',
        fontFamily: definition.tokens?.fontFamily || 'Georgia, "Times New Roman", serif',
        background: definition.tokens?.secondaryColor || '#fff',
        color: definition.tokens?.primaryColor || '#111',
      }}
    >
      {sections.map((section) => (
        <SectionView
          key={section.id}
          section={section}
          data={data}
          invitationSlug={invitationSlug}
          previewMode={previewMode}
          galleryImages={galleryImages}
        />
      ))}
    </article>
  );
}
