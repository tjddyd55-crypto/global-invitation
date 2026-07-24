'use client';

import { useParams } from 'next/navigation';
import RsvpManagementScreen from '@/src/features/invitations/ui/shared/RsvpManagementScreen';

export default function InvitationRsvpManagementPage() {
  const params = useParams();
  const invitationId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  if (!invitationId) return null;
  return <RsvpManagementScreen invitationId={invitationId} />;
}
