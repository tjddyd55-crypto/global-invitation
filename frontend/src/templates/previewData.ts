import type {
  FuneralInvitationData,
  MessageBrandedInvitationData,
  MessageSimpleInvitationData,
  MessageThankYouInvitationData,
  WeddingInvitationData,
} from '@/src/invitation/schemas';
import { getFuneralClassicDemoData } from '@/src/templates/funeralClassic/data';
import { getMessageBrandedJciDemoData } from '@/src/templates/messageBranded/jci/data';
import { getMessageSimpleDemoData } from '@/src/templates/messageSimple/data';
import { getMessageCardDemoData } from '@/src/templates/messageThankYou/data';
import { buildWeddingClassicData, getSampleWeddingInvitation } from '@/src/templates/weddingClassic/data';

export type TemplatePreviewData =
  | WeddingInvitationData
  | FuneralInvitationData
  | MessageSimpleInvitationData
  | MessageThankYouInvitationData
  | MessageBrandedInvitationData;

export const weddingPreviewData: WeddingInvitationData = buildWeddingClassicData(
  getSampleWeddingInvitation(),
  'en'
);

export const funeralPreviewData: FuneralInvitationData = getFuneralClassicDemoData();

export const messageSimplePreviewData: MessageSimpleInvitationData = {
  ...getMessageSimpleDemoData(),
  actions: {
    copyLink: false,
    kakaoShare: false,
    calendarSave: false,
  },
};

export const messageThankYouPreviewData: MessageThankYouInvitationData = {
  ...getMessageCardDemoData(),
  actions: {
    calendar: false,
    copyLink: false,
    kakaoShare: false,
  },
};

export const messageBrandedJciPreviewData: MessageBrandedInvitationData = getMessageBrandedJciDemoData();
