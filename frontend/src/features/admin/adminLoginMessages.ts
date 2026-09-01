export function formatAdminLoginRetryAfter(seconds?: number): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `약 ${minutes}분 후 다시 시도해 주세요.`;
  }
  return `약 ${seconds}초 후 다시 시도해 주세요.`;
}

export function mapAdminLoginErrorMessage(
  code: string,
  retryAfterSeconds?: number
): string {
  switch (code) {
    case 'ADMIN_INVALID_CREDENTIALS':
    case 'Invalid credentials':
      return '관리자 아이디 또는 비밀번호가 올바르지 않습니다.';
    case 'ADMIN_LOGIN_RATE_LIMITED':
    case 'Too many login attempts. Please try again later.':
    case 'LOGIN_RATE_LIMITED': {
      const retryHint = formatAdminLoginRetryAfter(retryAfterSeconds);
      return retryHint
        ? `로그인 시도가 너무 많습니다.\n${retryHint}`
        : '로그인 시도가 너무 많습니다.\n잠시 후 다시 시도해 주세요.';
    }
    case 'ADMIN_CREDENTIALS_REQUIRED':
      return '관리자 아이디와 비밀번호를 입력해 주세요.';
    case 'ADMIN_NOT_CONFIGURED':
      return '관리자 로그인이 아직 설정되지 않았습니다.';
    case 'ADMIN_LOGIN_FAILED':
    case 'FAILED_TO_LOGIN_ADMIN':
      return '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '관리자 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
}

export class AdminLoginError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(code: string, status: number, retryAfterSeconds?: number) {
    super(mapAdminLoginErrorMessage(code, retryAfterSeconds));
    this.name = 'AdminLoginError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
