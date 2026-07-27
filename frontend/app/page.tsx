import type { Metadata } from 'next';
import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import MobileHomeContent from '@/src/ui/mobile/MobileHomeContent';
import MobileShell from '@/src/ui/mobile/MobileShell';
import PcHomeContent from '@/src/ui/pc/PcHomeContent';
import PcShell from '@/src/ui/pc/PcShell';
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

/**
 * 공식 Main — viewport(1024) 로 Mobile/Desktop presentation 전환.
 * /m · /pc 홈은 QA용으로 유지.
 */
export default function HomePage() {
  return (
    <ResponsivePlatformBoundary
      mobile={
        <MobileShell>
          <MobileHomeContent />
        </MobileShell>
      }
      desktop={
        <PcShell>
          <PcHomeContent />
        </PcShell>
      }
    />
  );
}
