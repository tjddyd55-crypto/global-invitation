import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import MobileShell from '@/src/ui/mobile/MobileShell';

export const metadata: Metadata = {
  title: 'Global Invitation — Mobile',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Global Invitation',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 1,
};

export default function MobileLayout({ children }: { children: ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
