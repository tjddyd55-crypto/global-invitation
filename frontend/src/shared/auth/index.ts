// Shared auth surface — 기존 src/lib/auth.ts 의 안정적 API만 재export.
// UI 레이어(PC / Mobile)는 반드시 이 barrel 을 통해 import 한다.
// 이렇게 해야 추후 auth 구현이 교체(예: NextAuth)되어도 UI 코드를 건드리지 않는다.

export {
  ensureGuestToken,
  getGuestToken,
  setGuestToken,
  getStoredSession,
  setStoredSession,
  clearStoredSession,
  getSessionToken,
  buildAuthHeaders,
  fetchCurrentUser,
  fetchNavbarUser,
  getCachedNavbarUserSnapshot,
  logoutCurrentSession,
  requestMagicLink,
  verifyMagicLink,
  requestEmailVerificationCode,
  verifyEmailVerificationCode,
  signupWithPassword,
  loginWithPassword,
  isOwner,
  setLastDraftSlug,
  getLastDraftSlug,
  clearLastDraftSlug,
} from '@/src/lib/auth';

export type { AuthUser, AuthSession } from '@/src/lib/auth';
