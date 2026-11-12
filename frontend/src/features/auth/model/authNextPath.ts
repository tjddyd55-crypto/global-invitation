/**
 * 인증 완료 후 이동할 `next` 경로 검증.
 * 오픈 리다이렉트 방지: 내부 절대 경로(`/`로 시작, `//`는 제외)만 허용한다.
 */
import { sanitizeReturnPath } from '@/src/lib/loginRedirect';

export const DEFAULT_AUTH_NEXT_PATH = '/my-invitations';

export function resolveAuthNextPath(raw: string | null | undefined): string {
  if (!raw) {
    return DEFAULT_AUTH_NEXT_PATH;
  }
  return sanitizeReturnPath(raw);
}
