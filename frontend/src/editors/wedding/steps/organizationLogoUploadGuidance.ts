/**
 * Organization 로고 업로드 안내 — validator(SSOT: mediaApi)와 drift 방지.
 * 권장값이며 업로드 거부 조건이 아님 (특정 비율·최소 가로 강제 금지).
 */
import {
  formatAllowedImageFormatsLabel,
  formatMaxImageSizeLabel,
} from '@/src/lib/mediaApi';

export function getOrganizationLogoUploadGuidance(): {
  primary: string;
  secondary: string;
} {
  const formats = formatAllowedImageFormatsLabel();
  const maxSize = formatMaxImageSizeLabel();
  return {
    primary: `투명 배경 PNG 또는 WEBP를 권장합니다. 가로형·정사각형·세로형 로고 모두 사용할 수 있습니다. (${formats})`,
    secondary: `선명한 고해상도 로고를 사용해 주세요. 최대 ${maxSize}.`,
  };
}
