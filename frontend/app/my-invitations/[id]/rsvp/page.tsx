'use client';

import { useParams } from 'next/navigation';
import RsvpManagementScreen from '@/src/features/invitations/ui/shared/RsvpManagementScreen';
import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import MobileShell from '@/src/ui/mobile/MobileShell';
import PcShell from '@/src/ui/pc/PcShell';

export default function InvitationRsvpManagementPage() {
  const params = useParams();
  const invitationId =
    typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  if (!invitationId) return null;

  const body = <RsvpManagementScreen invitationId={invitationId} />;

  return (
    <ResponsivePlatformBoundary
      mobile={<MobileShell>{body}</MobileShell>}
      desktop={<PcShell>{body}</PcShell>}
    />
  );
}
