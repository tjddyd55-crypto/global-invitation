/**
 * 공개 문의 이메일 SSOT.
 * Contact / Footer / payment-info 등에서 이 모듈만 import 한다.
 */
export const SUPPORT_EMAIL = 'tjddyd55@gmail.com';

export function supportMailtoHref(subject = '글로벌 초대장 서비스 문의'): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
