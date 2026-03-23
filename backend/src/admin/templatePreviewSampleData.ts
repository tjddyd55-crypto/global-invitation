import type { Prisma } from '@prisma/client';

/**
 * 관리자 템플릿 미리보기용 샘플 필드 (플랫).
 * 프론트에서 카테고리별로 베이스 preview 데이터에 오버레이합니다.
 */
export function buildDefaultTemplatePreviewSample(template: { category: string }): Record<string, string> {
  switch (template.category) {
    case 'funeral':
      return {
        deceasedName: '故 홍길동',
        chiefMourner: '김순덕',
        date: '2026-05-02',
        location: '서울 장례식장',
        message: '삼가 고인의 명복을 빕니다. 따뜻한 위로 부탁드립니다.',
      };
    case 'message':
      return {
        message: '감사의 마음을 전합니다.',
        title: 'Thank you',
        subtitle: 'Admin preview',
      };
    case 'wedding':
    default:
      return {
        groomName: '홍길동',
        brideName: '김영희',
        date: '2026-05-01',
        location: '서울 웨딩홀',
        message: '함께해 주시면 감사하겠습니다.',
      };
  }
}

function extractSampleOverrides(studioConfig: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!studioConfig || typeof studioConfig !== 'object' || Array.isArray(studioConfig)) {
    return {};
  }
  const raw = (studioConfig as Record<string, unknown>).sampleOverrides;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return { ...(raw as Record<string, unknown>) };
}

/**
 * 기본 샘플 + `studioConfig.sampleOverrides` (크리에이터가 넣은 미리보기용 플랫 필드).
 */
export function buildTemplatePreviewSampleData(template: {
  category: string;
  studioConfig?: Prisma.JsonValue | null;
}): Record<string, unknown> {
  const defaults = buildDefaultTemplatePreviewSample(template);
  const overrides = extractSampleOverrides(template.studioConfig);
  return { ...defaults, ...overrides };
}
