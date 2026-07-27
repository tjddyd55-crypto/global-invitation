import type { Metadata } from 'next';
import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import MainScreen from '@/src/features/main/ui/mobile/MainScreen';
import DesktopMainScreen from '@/src/features/main/ui/pc/DesktopMainScreen';
import MobileShell from '@/src/ui/mobile/MobileShell';
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
 * Canonical Main — Figma MainScreen / DesktopMainScreen via viewport SSOT (1024).
 * Do not wire the archived marketing landing component here.
 */
export default function HomePage() {
  return (
    <ResponsivePlatformBoundary
      mobile={
        <MobileShell>
          <MainScreen />
        </MobileShell>
      }
      desktop={
        <PcShell>
          <DesktopMainScreen />
        </PcShell>
      }
    />
  );
}
