import type { Metadata } from 'next';
import {
  getSampleWeddingInvitation,
} from '@/src/templates/weddingClassic/data';
import type { Invitation } from '@/src/lib/api';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';

function resolveSafeSlug(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return '';
}

export async function generateMetadata(
  { params }: { params: { slug?: string | string[] } }
): Promise<Metadata> {
  const slug = resolveSafeSlug(params?.slug);
  const canonicalPath = buildCanonicalUrl(slug ? `/invitation/${slug}` : '/invitation');
  const imagePath = '/default-og.png';
  const fallbackTitle = 'Invitation';
  const fallbackDescription = "You're invited";

  try {
    const invitation = getSampleWeddingInvitation();
    const subtitle = (invitation as Invitation & { subtitle?: string | null }).subtitle ?? invitation.message;
    const title = invitation.title || fallbackTitle;
    const description = subtitle || fallbackDescription;

    return {
      title,
      description,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description,
        images: [imagePath],
        type: 'website',
        url: canonicalPath,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imagePath],
      },
    };
  } catch {
    return {
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

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
