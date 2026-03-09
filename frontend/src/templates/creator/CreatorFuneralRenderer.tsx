'use client';

import type { FuneralInvitationData } from '@/src/invitation/schemas';
import { parseStudioConfig } from '@/src/creator/studioConfig';
import FuneralClassicInvitation from '@/src/templates/funeralClassic/FuneralClassicInvitation';
import { buildCreatorFrameStyle, getSectionEnabled } from '@/src/templates/creator/renderUtils';

type CreatorFuneralRendererProps = {
  data?: FuneralInvitationData;
  runtimeData?: FuneralInvitationData;
  studioConfig?: unknown;
  onShare?: () => void;
  isShared?: boolean;
  onKakaoShare?: () => void;
};

export default function CreatorFuneralRenderer({
  data,
  runtimeData,
  studioConfig,
  onShare,
  isShared,
  onKakaoShare,
}: CreatorFuneralRendererProps) {
  const resolvedData = runtimeData ?? data;
  if (!resolvedData) return null;
  const parsedConfig = parseStudioConfig(studioConfig);
  const shareEnabled = getSectionEnabled(parsedConfig, 'share', true);

  return (
    <div style={buildCreatorFrameStyle(parsedConfig)}>
      <FuneralClassicInvitation
        data={resolvedData}
        onShare={shareEnabled ? onShare : undefined}
        isShared={isShared}
        onKakaoShare={shareEnabled ? onKakaoShare : undefined}
      />
    </div>
  );
}
