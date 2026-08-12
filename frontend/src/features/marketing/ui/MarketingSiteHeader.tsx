'use client';

import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import MarketingDesktopHeader, {
  type MarketingDesktopHeaderProps,
} from './MarketingDesktopHeader';
import MarketingMobileHeader from './MarketingMobileHeader';

/**
 * Public marketing chrome SSOT.
 * Home / Pricing / Contact must use this — not a page-local header fork.
 */
export default function MarketingSiteHeader(props: MarketingDesktopHeaderProps) {
  return (
    <div data-testid="marketing-site-header">
      <ResponsivePlatformBoundary
        mobile={<MarketingMobileHeader />}
        desktop={<MarketingDesktopHeader {...props} />}
      />
    </div>
  );
}
