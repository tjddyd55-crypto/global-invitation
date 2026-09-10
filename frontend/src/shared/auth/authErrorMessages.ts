export function mapAuthErrorCode(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'USERNAME_REQUIRED':
      return '아이디를 입력해 주세요.';
    case 'USERNAME_TOO_SHORT':
      return '아이디는 4자 이상이어야 합니다.';
    case 'USERNAME_TOO_LONG':
      return '아이디는 30자 이하여야 합니다.';
    case 'USERNAME_INVALID_FORMAT':
      return '아이디는 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.';
    case 'USERNAME_ALREADY_EXISTS':
      return '이미 사용 중인 아이디입니다.';
    case 'INVALID_EMAIL':
      return '올바른 이메일 주소를 입력해 주세요.';
    case 'EMAIL_ALREADY_EXISTS':
      return '이미 등록된 이메일입니다.';
    case 'PASSWORD_TOO_SHORT':
      return '비밀번호는 8자 이상이어야 합니다.';
    case 'PASSWORD_REQUIRED':
      return '비밀번호를 입력해 주세요.';
    case 'INVALID_CREDENTIALS':
      return '아이디 또는 비밀번호가 올바르지 않습니다.';
    case 'ACCOUNT_DEACTIVATED':
      return '비활성화된 계정입니다. 관리자에게 문의해 주세요.';
    case 'LOGIN_RATE_LIMITED':
    case 'RECOVERY_RATE_LIMITED':
      return '시도 횟수가 많습니다. 잠시 후 다시 시도해 주세요.';
    case 'RECOVERY_VERIFICATION_FAILED':
      return '입력한 계정 정보 또는 복구코드가 올바르지 않습니다.';
    case 'INVALID_OR_EXPIRED_TOKEN':
      return '링크가 만료되었거나 이미 사용되었습니다.';
    case 'INVALID_CURRENT_PASSWORD':
      return '현재 비밀번호가 올바르지 않습니다.';
    default:
      return fallback;
  }
}
