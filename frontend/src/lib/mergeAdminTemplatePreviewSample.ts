import type {
  FuneralInvitationData,
  MessageBrandedInvitationData,
  MessageSimpleInvitationData,
  MessageThankYouInvitationData,
  WeddingInvitationData,
} from '@/src/invitation/schemas';
import type { TemplatePreviewData } from '@/src/templates/previewData';
import type { TemplateDefinition } from '@/src/templates/registry';
import { getTemplatePreviewData } from '@/src/templates/registry';

function str(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function isWeddingLikeBase(base: TemplatePreviewData): base is WeddingInvitationData {
  return (
    typeof base === 'object' &&
    base !== null &&
    'groom' in base &&
    'bride' in base &&
    typeof (base as WeddingInvitationData).groom?.name === 'string'
  );
}

function isFuneralBase(base: TemplatePreviewData): base is FuneralInvitationData {
  return typeof base === 'object' && base !== null && (base as FuneralInvitationData).templateKey === 'funeral_classic';
}

function isMessageSimpleBase(base: TemplatePreviewData): base is MessageSimpleInvitationData {
  return (
    typeof base === 'object' && base !== null && (base as MessageSimpleInvitationData).templateKey === 'message_simple'
  );
}

function isMessageThankYouBase(base: TemplatePreviewData): base is MessageThankYouInvitationData {
  return (
    typeof base === 'object' &&
    base !== null &&
    'slug' in base &&
    'coverImage' in base &&
    'description' in base &&
    'actions' in base
  );
}

function isMessageBrandedBase(base: TemplatePreviewData): base is MessageBrandedInvitationData {
  return (
    typeof base === 'object' && base !== null && (base as MessageBrandedInvitationData).templateKey === 'message_branded'
  );
}

function weddingish(template: TemplateDefinition | null | undefined): boolean {
  const key = template?.templateKey ?? '';
  return template?.category === 'wedding' || key.startsWith('creator_wedding');
}

function funeralish(template: TemplateDefinition | null | undefined): boolean {
  const key = template?.templateKey ?? '';
  return template?.category === 'funeral' || key.startsWith('creator_funeral');
}

function messageish(template: TemplateDefinition | null | undefined): boolean {
  const key = template?.templateKey ?? '';
  return template?.category === 'message' || key.startsWith('creator_message');
}

/**
 * API에서 내려준 플랫 sampleData를 레지스트리 기본 preview에 합쳐 실제 렌더러에 넣을 수 있는 형태로 만듭니다.
 */
export function mergeAdminPreviewSample(
  template: TemplateDefinition | null | undefined,
  sampleData: Record<string, unknown> | null | undefined
): TemplatePreviewData | null {
  const templateKey = template?.templateKey?.trim() ?? '';
  if (!template || !templateKey) {
    return null;
  }

  const data = sampleData ?? {};
  const base = getTemplatePreviewData(templateKey);
  if (!base) {
    return null;
  }

  if (weddingish(template) && isWeddingLikeBase(base)) {
    const b = structuredClone(base);
    const groomName = str(data?.groomName);
    const brideName = str(data?.brideName);
    if (groomName) {
      b.groom = { ...b.groom, name: groomName };
    }
    if (brideName) {
      b.bride = { ...b.bride, name: brideName };
    }
    if (groomName && brideName) {
      b.coupleNames = `${groomName} ♥ ${brideName}`;
    }
    const dateStr = str(data?.date);
    if (dateStr) {
      const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T17:00:00`);
      if (!Number.isNaN(d.getTime())) {
        b.weddingDate = d;
        b.weddingDateTime = d.toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' });
      }
    }
    const loc = str(data?.location);
    if (loc) {
      b.venueName = loc;
    }
    const msg = str(data?.message);
    if (msg) {
      b.introQuote = msg;
      b.introText = [msg];
    }
    return b;
  }

  if (funeralish(template) && isFuneralBase(base)) {
    const b = structuredClone(base);
    const deceased = str(data?.deceasedName);
    if (deceased) {
      b.deceasedName = deceased;
    }
    const chief = str(data?.chiefMourner);
    if (chief) {
      b.chiefMourner = chief;
    }
    const dateStr = str(data?.date);
    if (dateStr) {
      b.deathDate = dateStr;
      b.schedule = { ...(b.schedule ?? {}), funeralDate: dateStr.includes('T') ? dateStr : `${dateStr}T09:00:00` };
    }
    const loc = str(data?.location);
    if (loc) {
      b.funeralHall = { ...(b.funeralHall ?? {}), name: loc };
    }
    const msg = str(data?.message);
    if (msg) {
      b.message = msg;
    }
    return b;
  }

  if (messageish(template)) {
    if (isMessageSimpleBase(base)) {
      const b = structuredClone(base);
      const msg = str(data?.message);
      if (msg) b.message = msg;
      const title = str(data?.title);
      if (title) b.title = title;
      const subtitle = str(data?.subtitle);
      if (subtitle) b.subtitle = subtitle;
      return b;
    }
    if (isMessageThankYouBase(base)) {
      const b = structuredClone(base);
      const msg = str(data?.message);
      if (msg) b.description = msg;
      const title = str(data?.title);
      if (title) b.title = title;
      const subtitle = str(data?.subtitle);
      if (subtitle) b.subtitle = subtitle;
      return b;
    }
    if (isMessageBrandedBase(base)) {
      const b = structuredClone(base);
      const msg = str(data?.message);
      if (msg) b.message = msg;
      const title = str(data?.title);
      if (title) b.title = title;
      return b;
    }
  }

  return structuredClone(base) as TemplatePreviewData;
}
