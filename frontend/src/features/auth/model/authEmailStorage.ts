/**
 * `/auth/email` → `/auth/verify` 이동 시 이메일을 전달하는 저장소.
 * URL 쿼리에 이메일을 노출하지 않기 위해 sessionStorage 를 사용한다.
 */
const AUTH_EMAIL_KEY = 'gi_auth_email';

export function saveAuthEmail(email: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(AUTH_EMAIL_KEY, email);
}

export function readAuthEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(AUTH_EMAIL_KEY);
}

export function clearAuthEmail(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(AUTH_EMAIL_KEY);
}
