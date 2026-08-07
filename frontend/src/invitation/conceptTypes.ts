/**
 * Invitation conceptType SSOT — dataJson.conceptType 문자열.
 * DB enum 아님. Prisma InvitationMusicCategory 와 별개.
 */
export const INVITATION_CONCEPT_TYPES = ['WEDDING', 'FUNERAL', 'GENERAL', 'ORGANIZATION'] as const;

export type InvitationConceptType = (typeof INVITATION_CONCEPT_TYPES)[number];

/** Visual template catalog / pending resume 대상 */
export const VISUAL_TEMPLATE_CONCEPTS = ['WEDDING', 'GENERAL', 'ORGANIZATION'] as const;

export type VisualTemplateConceptType = (typeof VISUAL_TEMPLATE_CONCEPTS)[number];

export function isInvitationConceptType(value: unknown): value is InvitationConceptType {
  return (
    typeof value === 'string' &&
    (INVITATION_CONCEPT_TYPES as readonly string[]).includes(value)
  );
}

export function isVisualTemplateConceptType(value: unknown): value is VisualTemplateConceptType {
  return (
    typeof value === 'string' &&
    (VISUAL_TEMPLATE_CONCEPTS as readonly string[]).includes(value)
  );
}

/** 음악 라이브러리 카테고리 — ORGANIZATION 은 GENERAL 카탈로그 재사용 (Prisma enum 미확장) */
export function musicCategoryForConcept(
  conceptType: InvitationConceptType | string | null | undefined
): 'WEDDING' | 'FUNERAL' | 'GENERAL' {
  if (conceptType === 'WEDDING' || conceptType === 'FUNERAL') return conceptType;
  return 'GENERAL';
}

export const DEFAULT_BRAND_ACCENT_COLOR = '#0B1F3A';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function normalizeBrandAccentColor(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_BRAND_ACCENT_COLOR;
  const trimmed = value.trim();
  return HEX_COLOR_RE.test(trimmed) ? trimmed.toUpperCase() : DEFAULT_BRAND_ACCENT_COLOR;
}

export type OrganizationBranding = {
  name?: string;
  englishName?: string;
  logo?: string;
  accentColor?: string;
};

export function normalizeOrganizationBranding(value: unknown): OrganizationBranding {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const englishName = typeof record.englishName === 'string' ? record.englishName.trim() : '';
  const logo = typeof record.logo === 'string' ? record.logo.trim() : '';
  const accentRaw = typeof record.accentColor === 'string' ? record.accentColor.trim() : '';
  const next: OrganizationBranding = {};
  if (name) next.name = name;
  if (englishName) next.englishName = englishName;
  if (logo) next.logo = logo;
  if (accentRaw && HEX_COLOR_RE.test(accentRaw)) next.accentColor = accentRaw.toUpperCase();
  return next;
}
