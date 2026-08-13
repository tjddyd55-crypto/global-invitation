/**
 * Organization 로고 업로드 안내 — validator(SSOT: mediaApi)와 drift 방지.
 * 권장값이며 업로드 거부 조건이 아님 (특정 비율·최소 가로 강제 금지).
 */
import { invitationT } from '@/src/i18n/invitationT';
import type { ProductLocaleId } from '@/src/i18n/productLocales';
import {
  formatAllowedImageFormatsLabel,
  formatMaxImageSizeLabel,
} from '@/src/lib/mediaApi';

export function getOrganizationLogoUploadGuidance(
  locale: ProductLocaleId = 'ko-KR'
): {
  primary: string;
  secondary: string;
} {
  const formats = formatAllowedImageFormatsLabel();
  const maxSize = formatMaxImageSizeLabel();
  return {
    primary: invitationT(locale, 'editor.org.logoGuidance', { formats }),
    secondary: invitationT(locale, 'editor.helper.logoSize', { maxSize }),
  };
}
