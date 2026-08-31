/**
 * Whitelist field resolvers — no eval / dynamic path execution.
 */
import type { CSSProperties } from 'react';
import type { GiFieldId } from './types';
import { buildTemplateInvitationModel } from '@/src/templates/shared/templateInvitationModel';
import type { WeddingInvitationData } from '@/src/invitation/schemas';

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (v && typeof v === 'object' && 'name' in (v as object)) {
      const name = (v as { name?: unknown }).name;
      if (typeof name === 'string' && name.trim()) return name.trim();
    }
  }
  return '';
}

export function resolveFieldValue(binding: GiFieldId, data: Record<string, unknown>): string {
  const model = buildTemplateInvitationModel(data as WeddingInvitationData);

  switch (binding) {
    case 'EVENT_TITLE':
      return model.title || pickString(data.title, data.heroTitle, data.eventTitle);
    case 'BRIDE_NAME':
      return model.bride?.name || pickString(data.brideName, data.bride);
    case 'GROOM_NAME':
      return model.groom?.name || pickString(data.groomName, data.groom);
    case 'HOST_NAME':
      return pickString(data.hostName, data.organizerName);
    case 'EVENT_DATE':
      return model.dateText || pickString(data.weddingDate, data.eventDate);
    case 'EVENT_TIME':
      return model.timeText || pickString(data.eventTime);
    case 'VENUE_NAME':
      return model.venueName || pickString(data.venueName, data.locationText);
    case 'VENUE_ADDRESS':
      return model.address || pickString(data.address, data.venueDetail, data.detailAddress);
    case 'MESSAGE_BODY':
      return (
        model.greetingLines.join('\n') ||
        pickString(data.content, data.introText, data.message)
      );
    default:
      return '';
  }
}

export function resolveHeroImage(data: Record<string, unknown>): string {
  return buildTemplateInvitationModel(data as WeddingInvitationData).heroImage || '';
}

export function resolveGalleryImages(data: Record<string, unknown>): string[] {
  const model = buildTemplateInvitationModel(data as WeddingInvitationData);
  return (model.gallery.items || [])
    .map((item) => {
      const row = item as { url?: string; src?: string; imageUrl?: string };
      return row.url || row.src || row.imageUrl || '';
    })
    .filter(Boolean);
}

export function styleToCss(style?: Record<string, unknown>): CSSProperties {
  if (!style) return {};
  const css: Record<string, string | number> = {};
  const pxKeys = new Set([
    'gap',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontSize',
    'borderRadius',
    'borderWidth',
    'letterSpacing',
    'minHeight',
    'lineHeight',
  ]);
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'number' && pxKeys.has(key)) {
      css[key] = `${value}px`;
    } else if (typeof value === 'string' || typeof value === 'number') {
      css[key] = value;
    }
  }
  return css as CSSProperties;
}
