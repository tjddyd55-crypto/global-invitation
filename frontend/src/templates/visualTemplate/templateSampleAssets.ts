/**
 * 템플릿 샘플 이미지 SSOT (R2 shared 카탈로그).
 *
 * 실제 오브젝트는 `backend/scripts/publish-template-sample-assets.ts` 로 발행한다.
 * 값은 R2 object key 이며, 화면에서는 `cdnImageSrc` 가 CDN 절대 URL 로 정규화한다.
 * 외부 스톡 URL 을 코드에 하드코딩하지 않는다.
 */
import { VISUAL_TEMPLATE_CONCEPT, type VisualTemplateId } from './ids';

const TEMPLATE_ASSET_PREFIX = 'invitation/shared/images/templates';
const SAMPLE_PHOTO_COUNT = 8;

function photoKeys(folder: string): string[] {
  return Array.from(
    { length: SAMPLE_PHOTO_COUNT },
    (_, index) => `${TEMPLATE_ASSET_PREFIX}/${folder}/photo-${String(index + 1).padStart(2, '0')}.webp`
  );
}

/**
 * ORGANIZATION 전용 R2 폴더 발행 전 — 공식 행사 톤의 GENERAL hero/thumb 을 재사용.
 * 이후 `ORGANIZATION_01_OFFICIAL/hero.webp` 발행 시 이 alias 를 제거한다.
 */
const ORGANIZATION_ASSET_ALIAS: Partial<Record<VisualTemplateId, VisualTemplateId>> = {
  ORGANIZATION_01_OFFICIAL: 'GENERAL_01_CLASSIC',
};

/** Hero 대표 이미지 (템플릿별) */
export function templateHeroAsset(id: VisualTemplateId): string {
  const resolved = ORGANIZATION_ASSET_ALIAS[id] ?? id;
  return `${TEMPLATE_ASSET_PREFIX}/${resolved}/hero.webp`;
}

/** 카탈로그 카드 썸네일 (4:3) */
export function templateThumbnailAsset(id: VisualTemplateId): string {
  const resolved = ORGANIZATION_ASSET_ALIAS[id] ?? id;
  return `${TEMPLATE_ASSET_PREFIX}/${resolved}/thumbnail.webp`;
}

export const WEDDING_SAMPLE_PHOTOS = photoKeys('shared-wedding');
/** GENERAL curated sample set — ORGANIZATION galleries reuse these keys (no separate org photo pack). */
export const GENERAL_SAMPLE_PHOTOS = photoKeys('shared-general');
/** Alias for ORGANIZATION fixtures — same R2 keys as GENERAL_SAMPLE_PHOTOS. */
export const ORGANIZATION_SAMPLE_PHOTOS = GENERAL_SAMPLE_PHOTOS;

export const WEDDING_GROOM_PROFILE = `${TEMPLATE_ASSET_PREFIX}/shared-wedding/groom.webp`;
export const WEDDING_BRIDE_PROFILE = `${TEMPLATE_ASSET_PREFIX}/shared-wedding/bride.webp`;

/**
 * 갤러리 샘플 — 자기 템플릿 Hero 를 첫 장으로, 같은 콘셉트의 다른 Hero 를 뒤에 붙여
 * 10장 이상의 자연스러운 앨범을 만든다.
 * ORGANIZATION 은 GENERAL 공유 포토 팩 + 자기 Hero 를 사용한다.
 */
export function buildSampleGallery(id: VisualTemplateId, siblingHeroIds: VisualTemplateId[]): string[] {
  const concept = VISUAL_TEMPLATE_CONCEPT[id];
  const photos =
    concept === 'WEDDING'
      ? WEDDING_SAMPLE_PHOTOS
      : concept === 'ORGANIZATION'
        ? ORGANIZATION_SAMPLE_PHOTOS
        : GENERAL_SAMPLE_PHOTOS;
  return [templateHeroAsset(id), ...photos, ...siblingHeroIds.map(templateHeroAsset)];
}
