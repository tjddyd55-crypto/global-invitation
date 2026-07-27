'use client';

import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import TemplatesScreen from '@/src/features/templates/ui/mobile/TemplatesScreen';
import TemplatesPage from '@/src/features/templates/ui/pc/TemplatesPage';
import MobileShell from '@/src/ui/mobile/MobileShell';
import PcShell from '@/src/ui/pc/PcShell';

/**
 * 공식 Concept Selection — viewport(1024) shell 전환.
 * /m/templates · /pc/templates 는 QA용.
 */
export default function ConceptSelectionPage() {
  return (
    <ResponsivePlatformBoundary
      mobile={
        <MobileShell>
          <TemplatesScreen />
        </MobileShell>
      }
      desktop={
        <PcShell>
          <TemplatesPage />
        </PcShell>
      }
    />
  );
}
