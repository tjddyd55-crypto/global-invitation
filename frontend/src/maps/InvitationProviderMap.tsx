'use client';

import PublicGoogleMap from './PublicGoogleMap';
import PublicNaverMap from './PublicNaverMap';
import type { InvitationMapSettings } from '@/src/invitation/mapSettings';
import type { InvitationLocation } from './types';

type InvitationProviderMapProps = {
  settings: InvitationMapSettings;
  location: InvitationLocation;
  layoutPlaceholder?: boolean;
  interactive?: boolean;
  surface?: 'preview' | 'public';
  className?: string;
};

/**
 * Preview/Public map canvas SSOT — provider branch lives here only.
 */
export default function InvitationProviderMap({
  settings,
  location,
  layoutPlaceholder = false,
  interactive = true,
  surface = 'public',
  className,
}: InvitationProviderMapProps) {
  if (settings.provider === 'NAVER') {
    return (
      <PublicNaverMap
        settings={settings}
        layoutPlaceholder={layoutPlaceholder}
        interactive={interactive}
        surface={surface}
        className={className}
      />
    );
  }

  return (
    <PublicGoogleMap
      location={location}
      layoutPlaceholder={layoutPlaceholder}
      className={className}
    />
  );
}
