'use client';

import type { WeddingInvitationData } from '@/src/invitation/schemas';
import { parseStudioConfig } from '@/src/creator/studioConfig';
import WeddingClassicInvitation from '@/src/templates/weddingClassic/WeddingClassicInvitation';
import { buildCreatorFrameStyle, getSectionEnabled } from '@/src/templates/creator/renderUtils';

type CreatorWeddingRendererProps = {
  data?: WeddingInvitationData;
  runtimeData?: WeddingInvitationData;
  studioConfig?: unknown;
  invitationSlug?: string;
  showPlayButton?: boolean;
  previewMode?: boolean;
  showRsvp?: boolean;
  showGuestbook?: boolean;
  onShare?: () => void;
  isShared?: boolean;
};

export default function CreatorWeddingRenderer({
  data,
  runtimeData,
  studioConfig,
  invitationSlug,
  showPlayButton,
  previewMode,
  showRsvp,
  showGuestbook,
  onShare,
  isShared,
}: CreatorWeddingRendererProps) {
  const resolvedData = runtimeData ?? data;
  if (!resolvedData) return null;
  const parsedConfig = parseStudioConfig(studioConfig);
  const mergedShowRsvp = getSectionEnabled(parsedConfig, 'rsvp', true) && (showRsvp ?? true);
  const mergedShowGuestbook = getSectionEnabled(parsedConfig, 'messages', true) && (showGuestbook ?? true);

  return (
    <div style={buildCreatorFrameStyle(parsedConfig)}>
      <WeddingClassicInvitation
        data={resolvedData}
        invitationSlug={invitationSlug}
        showPlayButton={showPlayButton}
        previewMode={previewMode}
        showRsvp={mergedShowRsvp}
        showGuestbook={mergedShowGuestbook}
        onShare={onShare}
        isShared={isShared}
      />
    </div>
  );
}
