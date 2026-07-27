'use client';

import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import ConceptSelectionScreen from '@/src/features/concept/ui/mobile/ConceptSelectionScreen';
import DesktopConceptSelectionScreen from '@/src/features/concept/ui/pc/DesktopConceptSelectionScreen';
import MobileShell from '@/src/ui/mobile/MobileShell';
import PcShell from '@/src/ui/pc/PcShell';

/**
 * Canonical Concept Selection — Figma ConceptSelectionScreen / DesktopConceptSelectionScreen.
 * Same UI as `/templates` (compat redirect target).
 */
export default function CreateConceptPage() {
  return (
    <ResponsivePlatformBoundary
      mobile={
        <MobileShell>
          <ConceptSelectionScreen />
        </MobileShell>
      }
      desktop={
        <PcShell>
          <DesktopConceptSelectionScreen />
        </PcShell>
      }
    />
  );
}
