import type { Metadata } from 'next';
import { buildCanonicalUrl, getMetadataBase } from '@/src/lib/siteUrl';

type SharedInvitationMeta = {
  title?: string | null;
  message?: string | null;
  data?: Record<string, unknown> | null;
  dataJson?: Record<string, unknown> | null;
};

function resolveSafeSlug(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return '';
}

function resolveBackendBaseUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  const fromServer = process.env.API_BASE_URL || process.env.BACKEND_URL;
  const candidate = fromPublic || fromServer || 'http://127.0.0.1:3001';
  return candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
}

function pickOgImage(payload: SharedInvitationMeta): string {
  const data = payload.dataJson || payload.data || {};
  const heroImage = typeof data.heroImage === 'string' ? data.heroImage : '';
  const ogImage = typeof data.ogImage === 'string' ? data.ogImage : '';
  if (heroImage) return heroImage;
  if (ogImage) return ogImage;
  return '/default-og.png';
}

function pickDescription(payload: SharedInvitationMeta): string {
  const data = payload.dataJson || payload.data || {};
  const ogDescription = typeof data.ogDescription === 'string' ? data.ogDescription : '';
  if (ogDescription) return ogDescription;
  if (payload.message) return payload.message;
  return "You're invited";
}

function pickTitle(payload: SharedInvitationMeta): string {
  const data = payload.dataJson || payload.data || {};
  const ogTitle = typeof data.ogTitle === 'string' ? data.ogTitle : '';
  if (ogTitle) return ogTitle;
  if (payload.title) return payload.title;
  return 'Invitation';
}

export async function generateMetadata(
  { params }: { params: { slug?: string | string[] } }
): Promise<Metadata> {
  const slug = resolveSafeSlug(params?.slug);
  const canonicalPath = buildCanonicalUrl(slug ? `/i/${slug}` : '/i');

  const fallbackTitle = 'Invitation';
  const fallbackDescription = "You're invited";

  if (!slug) {
    return {
      metadataBase: getMetadataBase(),
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: { canonical: canonicalPath },
    };
  }

  try {
    const response = await fetch(`${resolveBackendBaseUrl()}/api/invitations/share/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error('NOT_FOUND');
    }
    const payload = (await response.json()) as SharedInvitationMeta;
    const title = pickTitle(payload);
    const description = pickDescription(payload);
    const image = pickOgImage(payload);

    return {
      metadataBase: getMetadataBase(),
      title,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description,
        images: [image],
        type: 'website',
        url: canonicalPath,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      metadataBase: getMetadataBase(),
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        images: ['/default-og.png'],
        type: 'website',
        url: canonicalPath,
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDescription,
        images: ['/default-og.png'],
      },
    };
  }
}

export default function PublicShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
