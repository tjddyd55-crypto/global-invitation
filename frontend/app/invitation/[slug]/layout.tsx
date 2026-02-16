import type { Metadata } from 'next';
import {
  getSampleWeddingInvitation,
} from '@/src/templates/weddingClassic/data';
import type { Invitation } from '@/src/lib/api';
import { buildCanonicalUrl } from '@/src/lib/siteUrl';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : '';
    if (!slug) return {};

    const invitation = getSampleWeddingInvitation();
    const subtitle = (invitation as Invitation & { subtitle?: string | null }).subtitle ?? invitation.message;
    const title = invitation.title || 'Invitation';
    const description = subtitle || "You're invited";
    const canonicalPath = buildCanonicalUrl(`/invitation/${slug}`);
    const imagePath = '/default-og.png';

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
    const canonicalPath = buildCanonicalUrl(`/invitation/${params.slug ?? ''}`);
    return {
      title: 'Invitation',
      description: "You're invited",
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: 'Invitation',
        description: "You're invited",
        images: ['/default-og.png'],
        type: 'website',
        url: canonicalPath,
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Invitation',
        description: "You're invited",
        images: ['/default-og.png'],
      },
    };
  }
}

export default function InvitationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
