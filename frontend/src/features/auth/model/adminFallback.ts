import { loginAdmin } from '@/src/lib/adminApi';

/**
 * 일반 로그인이 실패했을 때 관리자 계정으로 재시도하는 후보 ID 들을 생성한다.
 * - "foo" → ["foo", "foo@naver.com"]
 * - "foo@naver.com" → ["foo@naver.com", "foo"]
 */
export function buildAdminIdCandidates(rawEmail: string): string[] {
  const normalized = rawEmail.trim();
  if (!normalized) return [];

  const candidates: string[] = [normalized];
  if (normalized.includes('@')) {
    const localPart = normalized.split('@')[0]?.trim();
    if (localPart) candidates.push(localPart);
  } else {
    candidates.push(`${normalized}@naver.com`);
  }

  return Array.from(new Set(candidates));
}

/**
 * 관리자 계정 후보들을 순차 시도한다.
 * - 한 개라도 성공하면 true 를 돌려준다.
 * - 네트워크/검증 오류는 모두 무시하고 다음 후보로 넘어간다.
 */
export async function tryAdminLoginFallback(rawEmail: string, password: string): Promise<boolean> {
  const candidates = buildAdminIdCandidates(rawEmail);
  for (const candidate of candidates) {
    try {
      await loginAdmin(candidate, password);
      return true;
    } catch {
      // try next
    }
  }
  return false;
}
