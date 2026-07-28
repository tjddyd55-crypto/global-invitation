/**
 * RSVP 설정 SSOT — Editor / Preview / Public 공통 selector.
 * 화면별 개별 필드 직접 참조 금지.
 */

import { getConceptPresentationConfig } from './conceptPresentationConfig';
import { resolveInvitationRsvpEnabled } from './schemas';

export type InvitationRsvpSettings = {
  enabled: boolean;
  buttonLabel: string;
  sectionTitle: string;
  description: string;
};

const DEFAULT_SECTION_TITLE = '참석 여부';
const DEFAULT_DESCRIPTION = '참석 가능 여부를 알려주세요.';
const DEFAULT_BUTTON_BY_CONCEPT: Record<string, string> = {
  WEDDING: '참석 여부 알리기',
  GENERAL: '참석 여부 확인',
  FUNERAL: '참석 여부 알리기',
};

const MAX_BUTTON_LABEL_LENGTH = 30;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function readString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return '';
}

export function clampRsvpButtonLabel(raw: string, fallback: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, MAX_BUTTON_LABEL_LENGTH);
}

/**
 * dataJson / legacy 필드를 단일 설정으로 정규화.
 * concept config 가 rsvp 를 허용하지 않으면 enabled=false.
 */
export function getInvitationRsvpSettings(
  data: unknown,
  conceptType?: string | null
): InvitationRsvpSettings {
  const resolvedConcept =
    (isRecord(data) && typeof data.conceptType === 'string' ? data.conceptType : null) ||
    conceptType ||
    'GENERAL';
  const conceptAllows = getConceptPresentationConfig(resolvedConcept).rsvp;
  const defaultButton =
    DEFAULT_BUTTON_BY_CONCEPT[resolvedConcept] || DEFAULT_BUTTON_BY_CONCEPT.GENERAL;

  if (!isRecord(data)) {
    return {
      enabled: false,
      buttonLabel: defaultButton,
      sectionTitle: DEFAULT_SECTION_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
  }

  const nested = isRecord(data.rsvp) ? data.rsvp : null;
  const enabledRaw = resolveInvitationRsvpEnabled(data);

  const buttonRaw = readString(
    nested?.buttonLabel,
    nested?.buttonText,
    data.rsvpButton,
    data.rsvpButtonLabel,
    data.attendanceButtonLabel,
    data.rsvpButtonText
  );
  const sectionTitle =
    readString(nested?.sectionTitle, data.rsvpTitle, data.attendanceTitle) || DEFAULT_SECTION_TITLE;
  const description =
    readString(nested?.description, data.rsvpDescription, data.attendanceDescription) ||
    DEFAULT_DESCRIPTION;

  return {
    enabled: Boolean(conceptAllows && enabledRaw),
    buttonLabel: clampRsvpButtonLabel(buttonRaw, defaultButton),
    sectionTitle,
    description,
  };
}

export const RSVP_BUTTON_LABEL_MAX_LENGTH = MAX_BUTTON_LABEL_LENGTH;
