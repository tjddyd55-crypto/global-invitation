'use client';

import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import MyInvitationsScreen from '@/src/features/invitations/ui/mobile/MyInvitationsScreen';
import MyInvitationsPage from '@/src/features/invitations/ui/pc/MyInvitationsPage';
import MobileShell from '@/src/ui/mobile/MobileShell';
import PcShell from '@/src/ui/pc/PcShell';

/**
 * 공식 내 초대장 — viewport(1024) shell 전환.
 */
export default function MyInvitationsRoutePage() {
  return (
    <ResponsivePlatformBoundary
      mobile={
        <MobileShell>
          <MyInvitationsScreen />
        </MobileShell>
      }
      desktop={
        <PcShell>
          <MyInvitationsPage />
        </PcShell>
      }
    />
  );
}
