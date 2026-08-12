/**
 * Organization 로고 업로드 안내 — validator(SSOT: mediaApi)와 drift 방지.
 * 권장값이며 업로드 거부 조건이 아님 (가로 1200px 미만도 허용).
 */
import {
  formatAllowedImageFormatsLabel,
  formatMaxImageSizeLabel,
} from '@/src/lib/mediaApi';

export const ORGANIZATION_LOGO_RECOMMENDED_MIN_WIDTH_PX = 1200;

export function getOrganizationLogoUploadGuidance(): {
  primary: string;
  secondary: string;
} {
  const formats = formatAllowedImageFormatsLabel();
  const maxSize = formatMaxImageSizeLabel();
  return {
    primary: `권장: 가로 ${ORGANIZATION_LOGO_RECOMMENDED_MIN_WIDTH_PX}px 이상 · ${formats} · 투명 배경 권장`,
    secondary: `최대 ${maxSize} · 원본 비율을 유지해 잘리지 않게 표시됩니다.`,
  };
}
