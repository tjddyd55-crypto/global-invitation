import type { Metadata } from 'next';
import {
  buildWeddingClassicMetadata,
  getWeddingClassicDemoInvitation,
  isWeddingClassicDemoSlug,
  isWeddingClassicTemplate,
} from '@/src/templates/weddingClassic/data';
import { isFuneralClassicTemplate } from '@/src/templates/funeralClassic/data';
import type { Invitation } from '@/src/lib/api';
import { I18N_KEYS, SUPPORTED_LANGUAGES, translate, type Language } from '@/src/i18n';
import { buildCanonicalUrl, getMetadataBase } from '@/src/lib/siteUrl';

async function fetchInvitation(slug: string): Promise<Invitation | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) return null;

  const response = await fetch(`${apiBaseUrl}/api/invitations/${slug}`, { cache: 'no-store' });
  if (!response.ok) return null;
  return response.json();
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
  if (isWeddingClassicDemoSlug(params.slug)) {
    const demoInvitation = getWeddingClassicDemoInvitation();
    const metadataBase = getMetadataBase();
    const meta = buildWeddingClassicMetadata(demoInvitation);
    const imageUrl = buildCanonicalUrl(meta.heroImage);
    const pageUrl = buildCanonicalUrl(`/invitation/${demoInvitation.slug}`);

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
  }

  const invitation = await fetchInvitation(params.slug);
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
}

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
