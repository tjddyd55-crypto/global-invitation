import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { buildWeddingClassicMetadata, isWeddingClassicTemplate } from '@/src/templates/weddingClassic/data';
import type { Invitation } from '@/src/lib/api';

async function fetchInvitation(slug: string): Promise<Invitation | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) return null;

  const response = await fetch(`${apiBaseUrl}/api/invitations/${slug}`, { cache: 'no-store' });
  if (!response.ok) return null;
  return response.json();
}

function getBaseUrl(): URL | undefined {
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  if (!host) return undefined;
  const protocol = headerList.get('x-forwarded-proto') ?? 'https';
  return new URL(`${protocol}://${host}`);
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const invitation = await fetchInvitation(params.slug);
  if (!invitation) return {};

  const baseUrl = getBaseUrl();
  const fallbackTitle = invitation.title || '초대장';
  const fallbackDescription = invitation.locationText || '모바일 초대장';
  const fallbackImage = '/templates/basic.jpg';

  const meta = isWeddingClassicTemplate(invitation.templateKey)
    ? buildWeddingClassicMetadata(invitation)
    : { title: fallbackTitle, description: fallbackDescription, heroImage: fallbackImage };

  const imageUrl = baseUrl ? new URL(meta.heroImage, baseUrl).toString() : meta.heroImage;
  const pageUrl = baseUrl ? new URL(`/invitation/${invitation.slug}`, baseUrl).toString() : undefined;

  return {
    metadataBase: baseUrl,
    title: meta.title,
    description: meta.description,
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
