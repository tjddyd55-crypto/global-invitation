import type { WeddingClassicData } from '@/src/templates/weddingClassic/data';
import type { FuneralInvitation } from '@/src/templates/funeralClassic/data';
import type { MessageCardSimple } from '@/src/models/messageSimple';
import type { MessageCardData } from '@/src/models/messageCard';
import type { BrandedMessageCard } from '@/src/models/messageBranded';

export type WeddingInvitationData = WeddingClassicData;
export type FuneralInvitationData = FuneralInvitation;
export type MessageSimpleInvitationData = MessageCardSimple;
export type MessageThankYouInvitationData = MessageCardData;
export type MessageBrandedInvitationData = BrandedMessageCard;
export type MessageInvitationData =
  | MessageSimpleInvitationData
  | MessageThankYouInvitationData
  | MessageBrandedInvitationData;

export type InvitationRuntimeData =
  | WeddingInvitationData
  | FuneralInvitationData
  | MessageInvitationData;

export type StoredWeddingInvitationData = Omit<WeddingInvitationData, 'weddingDate'> & {
  weddingDate: string;
};

export type StoredInvitationRuntimeData =
  | StoredWeddingInvitationData
  | FuneralInvitationData
  | MessageInvitationData;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasWeddingDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function isWeddingInvitationData(value: unknown): value is WeddingInvitationData {
  if (!isRecord(value)) return false;
  if (typeof value.heroImage !== 'string') return false;
  if (typeof value.heroTitle !== 'string') return false;
  if (typeof value.heroSubtitle !== 'string') return false;
  if (typeof value.coupleNames !== 'string') return false;
  if (typeof value.weddingDateTime !== 'string') return false;
  if (typeof value.venueName !== 'string') return false;
  if (typeof value.introQuote !== 'string') return false;
  if (!isStringArray(value.introText)) return false;
  if (!isRecord(value.groom) || typeof value.groom.name !== 'string') return false;
  if (!isRecord(value.bride) || typeof value.bride.name !== 'string') return false;
  if (!hasWeddingDate(value.weddingDate)) return false;
  if (!isStringArray(value.galleryImages)) return false;
  if (typeof value.address !== 'string') return false;
  if (typeof value.mapImage !== 'string') return false;
  if (!isStringArray(value.transportInfo)) return false;
  if (!isStringArray(value.parkingInfo)) return false;
  if (!Array.isArray(value.accounts)) return false;
  if (!Array.isArray(value.messages)) return false;
  return true;
}

export function isFuneralInvitationData(value: unknown): value is FuneralInvitationData {
  if (!isRecord(value)) return false;
  if (value.templateKey !== 'funeral_classic') return false;
  if (typeof value.deceasedName !== 'string') return false;
  if (typeof value.deathDate !== 'string') return false;
  if (typeof value.chiefMourner !== 'string') return false;
  if (typeof value.message !== 'string') return false;
  if (!isRecord(value.funeralHall) || typeof value.funeralHall.name !== 'string') return false;
  if (!isRecord(value.schedule) || typeof value.schedule.funeralDate !== 'string') return false;
  return true;
}

export function isMessageSimpleInvitationData(value: unknown): value is MessageSimpleInvitationData {
  if (!isRecord(value)) return false;
  if (value.templateKey !== 'message_simple') return false;
  if (typeof value.heroImage !== 'string') return false;
  if (typeof value.message !== 'string') return false;
  if (!isRecord(value.actions)) return false;
  return true;
}

export function isMessageThankYouInvitationData(value: unknown): value is MessageThankYouInvitationData {
  if (!isRecord(value)) return false;
  if (typeof value.slug !== 'string') return false;
  if (typeof value.coverImage !== 'string') return false;
  if (typeof value.title !== 'string') return false;
  if (!isRecord(value.actions)) return false;
  return true;
}

export function isMessageBrandedInvitationData(value: unknown): value is MessageBrandedInvitationData {
  if (!isRecord(value)) return false;
  if (value.templateKey !== 'message_branded') return false;
  if (!isRecord(value.brand) || typeof value.brand.key !== 'string') return false;
  if (typeof value.heroImage !== 'string') return false;
  if (typeof value.title !== 'string') return false;
  if (typeof value.message !== 'string') return false;
  if (!isRecord(value.schedule) || typeof value.schedule.date !== 'string') return false;
  if (!isRecord(value.map) || typeof value.map.label !== 'string') return false;
  return true;
}

export function isMessageInvitationData(value: unknown): value is MessageInvitationData {
  return (
    isMessageSimpleInvitationData(value) ||
    isMessageThankYouInvitationData(value) ||
    isMessageBrandedInvitationData(value)
  );
}

export function isInvitationRuntimeData(value: unknown): value is InvitationRuntimeData {
  return (
    isWeddingInvitationData(value) ||
    isFuneralInvitationData(value) ||
    isMessageInvitationData(value)
  );
}
