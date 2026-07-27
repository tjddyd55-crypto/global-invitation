'use client';

import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import ConceptSelectionScreen from '@/src/features/concept/ui/mobile/ConceptSelectionScreen';
import DesktopConceptSelectionScreen from '@/src/features/concept/ui/pc/DesktopConceptSelectionScreen';

/**
 * Canonical Concept Selection — Figma ConceptSelectionScreen / DesktopConceptSelectionScreen.
 * Marketing shell (no legacy app sidebar/bottom-nav) — see src/shared/platform/platformShell.ts.
 */
export default function CreateConceptPage() {
  return (
    <ResponsivePlatformBoundary
      mobile={<ConceptSelectionScreen />}
      desktop={<DesktopConceptSelectionScreen />}
    />
  );
}
