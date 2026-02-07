import type { Metadata } from 'next';
import {
  buildWeddingClassicMetadata,
  getWeddingClassicDemoInvitation,
  isWeddingClassicDemoSlug,
  getSampleWeddingInvitation,
  isSampleWeddingSlug,
  isWeddingClassicTemplate,
} from '@/src/templates/weddingClassic/data';
import { isFuneralClassicTemplate } from '@/src/templates/funeralClassic/data';
import type { Invitation } from '@/src/lib/api';
import { I18N_KEYS, SUPPORTED_LANGUAGES, translate, type Language } from '@/src/i18n';
import { buildCanonicalUrl, getMetadataBase } from '@/src/lib/siteUrl';

function resolveStaticInvitation(slug: string): Invitation | null {
  if (isWeddingClassicDemoSlug(slug)) {
    return getWeddingClassicDemoInvitation();
  }
  if (isSampleWeddingSlug(slug)) {
    return getSampleWeddingInvitation();
  }
  return null;
}

/** Demo/sample only: metadata with relative paths. No env, no URL(), no fetch. */
function buildStaticDemoMetadata(slug: string, invitation: Invitation): Metadata {
  const meta = buildWeddingClassicMetadata(invitation);
  const canonicalPath = `/invitation/${slug}`;
  const imagePath = meta.heroImage.startsWith('/') ? meta.heroImage : `/${meta.heroImage}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: meta.title,
      description: meta.description,
      images: [imagePath],
      type: 'website',
      url: canonicalPath,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [imagePath],
    },
  };
}

function resolveLanguage(value?: string | null): Language {
  if (!value) return 'en';
  const normalized = value.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalized as Language) ? (normalized as Language) : 'en';
}

function buildShareMeta(language: Language, templateKey?: string | null) {
  if (templateKey && isFuneralClassicTemplate(templateKey)) {
    return {
      title: translate(language, I18N_KEYS.share.titleFuneral),
      description: translate(language, I18N_KEYS.share.descriptionFuneral),
    };
  }

  if (templateKey && isWeddingClassicTemplate(templateKey)) {
    return {
      title: translate(language, I18N_KEYS.share.titleWedding),
      description: translate(language, I18N_KEYS.share.descriptionWedding),
    };
  }

  return {
    title: translate(language, I18N_KEYS.share.titleMessage),
    description: translate(language, I18N_KEYS.share.descriptionMessage),
  };
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : '';
    if (!slug) return {};

    if (isSampleWeddingSlug(slug) || isWeddingClassicDemoSlug(slug)) {
      const invitation = isSampleWeddingSlug(slug) ? getSampleWeddingInvitation() : getWeddingClassicDemoInvitation();
      return buildStaticDemoMetadata(slug, invitation);
    }

    const invitation = resolveStaticInvitation(slug);
    if (!invitation) return {};

    const metadataBase = getMetadataBase();
    const fallbackImage = '/templates/basic.jpg';
    const language = resolveLanguage(invitation.language);
    const shareMeta = buildShareMeta(language, invitation.templateKey);

    const meta = isWeddingClassicTemplate(invitation.templateKey)
      ? buildWeddingClassicMetadata(invitation)
      : { title: shareMeta.title, description: shareMeta.description, heroImage: fallbackImage };

    const imageUrl = buildCanonicalUrl(meta.heroImage);
    const pageUrl = buildCanonicalUrl(`/invitation/${invitation.slug}`);

    return {
      metadataBase,
      title: meta.title,
      description: meta.description,
      alternates: { canonical: pageUrl },
      openGraph: {
        title: meta.title,
        description: meta.description,
        images: [imageUrl],
        type: 'website',
        url: pageUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title: meta.title,
        description: meta.description,
        images: [imageUrl],
      },
    };
  } catch {
    return {};
  }
}

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
