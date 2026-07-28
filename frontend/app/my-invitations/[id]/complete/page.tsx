'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import PublishCompleteScreen from '@/src/features/invitations/ui/shared/PublishCompleteScreen';
import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import { getInvitationOpenGraphSettings } from '@/src/invitation/openGraphSettings';
import { getInvitationForEditor } from '@/src/lib/api';
import { buildAbsolutePublicInvitationUrl } from '@/src/lib/publicInvitation';
import MobileShell from '@/src/ui/mobile/MobileShell';
import PcShell from '@/src/ui/pc/PcShell';

type CompleteShareState = {
  shareUrl: string;
  title: string;
  description: string;
  imageUrl?: string;
};

export default function PublishCompletePage() {
  const params = useParams();
  const invitationId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const [share, setShare] = useState<CompleteShareState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!invitationId) return;
      try {
        const invitation = await getInvitationForEditor(invitationId);
        if (!mounted) return;
        if (!invitation.shareSlug) {
          setError('아직 공개 링크가 없습니다. 에디터에서 먼저 공개해 주세요.');
          return;
        }
        const origin = window.location.origin;
        const shareUrl = buildAbsolutePublicInvitationUrl(origin, invitation.shareSlug);
        const og = getInvitationOpenGraphSettings(invitation, shareUrl, { siteOrigin: origin });
        setShare({
          shareUrl,
          title: og.title,
          description: og.description,
          imageUrl: og.imageUrl,
        });
      } catch {
        if (mounted) setError('초대장 정보를 불러오지 못했습니다.');
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [invitationId]);

  const body = (
    <RequireAuth nextPath={`/my-invitations/${invitationId}/complete`}>
      {error && <p style={{ padding: 24, color: 'var(--gi-danger)' }}>{error}</p>}
      {!error && share && (
        <PublishCompleteScreen
          invitationId={invitationId}
          shareUrl={share.shareUrl}
          title={share.title}
          description={share.description}
          imageUrl={share.imageUrl}
        />
      )}
    </RequireAuth>
  );

  return (
    <ResponsivePlatformBoundary
      mobile={<MobileShell>{body}</MobileShell>}
      desktop={<PcShell>{body}</PcShell>}
    />
  );
}
