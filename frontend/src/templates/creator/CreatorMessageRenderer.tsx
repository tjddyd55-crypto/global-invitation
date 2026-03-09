'use client';

import {
  isMessageBrandedInvitationData,
  isMessageSimpleInvitationData,
  isMessageThankYouInvitationData,
  type MessageInvitationData,
} from '@/src/invitation/schemas';
import { parseStudioConfig } from '@/src/creator/studioConfig';
import MessageSimpleCard from '@/src/templates/messageSimple/MessageSimpleCard';
import MessageThankYouCard from '@/src/templates/messageThankYou/MessageThankYouCard';
import MessageBrandedJCI from '@/src/templates/messageBranded/jci/MessageBrandedJCI';
import { buildCreatorFrameStyle, getSectionEnabled } from '@/src/templates/creator/renderUtils';
import { messageSimplePreviewData } from '@/src/templates/previewData';

type CreatorMessageRendererProps = {
  data?: MessageInvitationData;
  runtimeData?: MessageInvitationData;
  studioConfig?: unknown;
  onShare?: () => void;
  isShared?: boolean;
  previewMode?: boolean;
};

function disableSimpleActions(data: MessageInvitationData) {
  if (!isMessageSimpleInvitationData(data)) return data;
  return {
    ...data,
    actions: {
      copyLink: false,
      kakaoShare: false,
      calendarSave: false,
    },
  };
}

function disableThankYouActions(data: MessageInvitationData) {
  if (!isMessageThankYouInvitationData(data)) return data;
  return {
    ...data,
    actions: {
      calendar: false,
      copyLink: false,
      kakaoShare: false,
    },
  };
}

export default function CreatorMessageRenderer({
  data,
  runtimeData,
  studioConfig,
  onShare,
  isShared,
  previewMode = false,
}: CreatorMessageRendererProps) {
  const parsedConfig = parseStudioConfig(studioConfig);
  const shareEnabled = getSectionEnabled(parsedConfig, 'share', true);
  const frameStyle = buildCreatorFrameStyle(parsedConfig);
  const safeData = runtimeData ?? data ?? messageSimplePreviewData;

  let renderingData = safeData;
  if (!shareEnabled) {
    renderingData = disableThankYouActions(disableSimpleActions(safeData));
  }

  return (
    <div style={frameStyle}>
      {isMessageBrandedInvitationData(renderingData) ? (
        <MessageBrandedJCI
          data={renderingData}
          onShare={shareEnabled ? onShare : undefined}
          isShared={isShared}
          previewMode={previewMode}
        />
      ) : isMessageThankYouInvitationData(renderingData) ? (
        <MessageThankYouCard
          data={renderingData}
          onShare={shareEnabled ? onShare : undefined}
          isShared={isShared}
          interactive={!previewMode}
        />
      ) : (
        <MessageSimpleCard
          data={isMessageSimpleInvitationData(renderingData) ? renderingData : messageSimplePreviewData}
          onShare={shareEnabled ? onShare : undefined}
          isShared={isShared}
        />
      )}
    </div>
  );
}
