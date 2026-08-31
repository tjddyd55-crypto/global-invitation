/**
 * Field / component / copy whitelists — no eval, no arbitrary paths.
 */
import type { GiCopyId, GiFieldId } from './types';

/** Maps GI_FIELD → invitation dataJson accessor keys (resolved at runtime on FE). */
export const FIELD_BINDING_REGISTRY: Record<
  GiFieldId,
  { label: string; dataKeys: string[] }
> = {
  EVENT_TITLE: { label: 'Event title', dataKeys: ['title', 'heroTitle', 'eventTitle'] },
  BRIDE_NAME: { label: 'Bride name', dataKeys: ['brideName', 'bride.name', 'bride'] },
  GROOM_NAME: { label: 'Groom name', dataKeys: ['groomName', 'groom.name', 'groom'] },
  HOST_NAME: { label: 'Host name', dataKeys: ['hostName', 'organizerName'] },
  EVENT_DATE: { label: 'Event date', dataKeys: ['weddingDate', 'eventDate', 'weddingDateTime'] },
  EVENT_TIME: { label: 'Event time', dataKeys: ['weddingDateTime', 'eventTime'] },
  VENUE_NAME: { label: 'Venue name', dataKeys: ['venueName', 'locationText'] },
  VENUE_ADDRESS: {
    label: 'Venue address',
    dataKeys: ['address', 'venueDetail', 'detailAddress', 'locationText'],
  },
  MESSAGE_BODY: {
    label: 'Message',
    dataKeys: ['content', 'introText', 'message', 'greeting'],
  },
};

export const COPY_KEY_REGISTRY: Record<GiCopyId, { ko: string; en: string }> = {
  LOCATION_TITLE: { ko: '오시는 길', en: 'Location' },
  RSVP_TITLE: { ko: '참석 여부', en: 'RSVP' },
  ACCOUNT_TITLE: { ko: '마음 전하실 곳', en: 'Gift accounts' },
  GALLERY_TITLE: { ko: '갤러리', en: 'Gallery' },
  HOST_TITLE: { ko: '모시는 글', en: 'Hosts' },
  MESSAGE_TITLE: { ko: '초대 인사', en: 'Invitation' },
  FOOTER_NOTE: { ko: '소중한 날에 함께해 주세요', en: 'We look forward to celebrating with you' },
};

export const STYLE_ALLOWLIST = new Set([
  'display',
  'flexDirection',
  'gap',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'alignItems',
  'justifyContent',
  'textAlign',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'color',
  'backgroundColor',
  'borderRadius',
  'borderWidth',
  'borderColor',
  'opacity',
  'width',
  'maxWidth',
  'minHeight',
  'objectFit',
]);

export function pickAllowlistedStyle(raw: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!STYLE_ALLOWLIST.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' || typeof value === 'number') {
      out[key] = value;
    }
  }
  return out;
}
