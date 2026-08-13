'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RequireAuth from '@/src/features/auth/ui/shared/RequireAuth';
import PublishCompleteScreen from '@/src/features/invitations/ui/shared/PublishCompleteScreen';
import ResponsivePlatformBoundary from '@/src/shared/platform/ResponsivePlatformBoundary';
import { getInvitationOpenGraphSettings } from '@/src/invitation/openGraphSettings';
import { getInvitationForEditor } from '@/src/lib/api';
import { buildAbsolutePublicInvitationUrl } from '@/src/lib/publicInvitation';
import { useI18n } from '@/src/contexts/I18nContext';
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
  const { t } = useI18n();
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
          setError(t('publishComplete.errorNoLink'));
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
        if (mounted) setError(t('publishComplete.errorLoad'));
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [invitationId, t]);

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
