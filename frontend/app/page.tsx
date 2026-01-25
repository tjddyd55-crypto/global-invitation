import type { Metadata } from 'next';
import HomePageClient from '@/src/components/HomePageClient';
import { buildCanonicalUrl, getMetadataBase } from '@/src/lib/siteUrl';

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Global Invitation';
  const description = 'Create and share digital invitations, messages, and branded announcements.';
  const canonicalUrl = buildCanonicalUrl('/');

  return {
    metadataBase: getMetadataBase(),
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
    },
  };
}

export default function HomePage() {
  return <HomePageClient />;
}
