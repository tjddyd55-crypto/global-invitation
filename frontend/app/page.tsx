import type { Metadata } from 'next';
import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import MainScreen from '@/src/features/main/ui/mobile/MainScreen';
import DesktopMainScreen from '@/src/features/main/ui/pc/DesktopMainScreen';
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
 * Marketing shell (no legacy app sidebar/bottom-nav) — see src/shared/platform/platformShell.ts.
 */
export default function HomePage() {
  return (
    <ResponsivePlatformBoundary
      mobile={<MainScreen />}
      desktop={<DesktopMainScreen />}
    />
  );
}
