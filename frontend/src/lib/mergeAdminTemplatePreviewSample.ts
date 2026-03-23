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

function weddingish(template: TemplateDefinition): boolean {
  return template.category === 'wedding' || template.templateKey.startsWith('creator_wedding');
}

function funeralish(template: TemplateDefinition): boolean {
  return template.category === 'funeral' || template.templateKey.startsWith('creator_funeral');
}

function messageish(template: TemplateDefinition): boolean {
  return template.category === 'message' || template.templateKey.startsWith('creator_message');
}

/**
 * API에서 내려준 플랫 sampleData를 레지스트리 기본 preview에 합쳐 실제 렌더러에 넣을 수 있는 형태로 만듭니다.
 */
export function mergeAdminPreviewSample(
  template: TemplateDefinition,
  sampleData: Record<string, unknown>
): TemplatePreviewData | null {
  const base = getTemplatePreviewData(template.templateKey);
  if (!base) {
    return null;
  }

  if (weddingish(template) && isWeddingLikeBase(base)) {
    const b = structuredClone(base);
    const groomName = str(sampleData.groomName);
    const brideName = str(sampleData.brideName);
    if (groomName) {
      b.groom = { ...b.groom, name: groomName };
    }
    if (brideName) {
      b.bride = { ...b.bride, name: brideName };
    }
    if (groomName && brideName) {
      b.coupleNames = `${groomName} ♥ ${brideName}`;
    }
    const dateStr = str(sampleData.date);
    if (dateStr) {
      const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T17:00:00`);
      if (!Number.isNaN(d.getTime())) {
        b.weddingDate = d;
        b.weddingDateTime = d.toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' });
      }
    }
    const loc = str(sampleData.location);
    if (loc) {
      b.venueName = loc;
    }
    const msg = str(sampleData.message);
    if (msg) {
      b.introQuote = msg;
      b.introText = [msg];
    }
    return b;
  }

  if (funeralish(template) && isFuneralBase(base)) {
    const b = structuredClone(base);
    const deceased = str(sampleData.deceasedName);
    if (deceased) {
      b.deceasedName = deceased;
    }
    const chief = str(sampleData.chiefMourner);
    if (chief) {
      b.chiefMourner = chief;
    }
    const dateStr = str(sampleData.date);
    if (dateStr) {
      b.deathDate = dateStr;
      b.schedule = { ...b.schedule, funeralDate: dateStr.includes('T') ? dateStr : `${dateStr}T09:00:00` };
    }
    const loc = str(sampleData.location);
    if (loc) {
      b.funeralHall = { ...b.funeralHall, name: loc };
    }
    const msg = str(sampleData.message);
    if (msg) {
      b.message = msg;
    }
    return b;
  }

  if (messageish(template)) {
    if (isMessageSimpleBase(base)) {
      const b = structuredClone(base);
      const msg = str(sampleData.message);
      if (msg) b.message = msg;
      const title = str(sampleData.title);
      if (title) b.title = title;
      const subtitle = str(sampleData.subtitle);
      if (subtitle) b.subtitle = subtitle;
      return b;
    }
    if (isMessageThankYouBase(base)) {
      const b = structuredClone(base);
      const msg = str(sampleData.message);
      if (msg) b.description = msg;
      const title = str(sampleData.title);
      if (title) b.title = title;
      const subtitle = str(sampleData.subtitle);
      if (subtitle) b.subtitle = subtitle;
      return b;
    }
    if (isMessageBrandedBase(base)) {
      const b = structuredClone(base);
      const msg = str(sampleData.message);
      if (msg) b.message = msg;
      const title = str(sampleData.title);
      if (title) b.title = title;
      return b;
    }
  }

  return structuredClone(base) as TemplatePreviewData;
}
