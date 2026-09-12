import { apiRequest } from '@/src/api/client';

export type AuthUser = {
  id: string;
  username: string | null;
  email: string | null;
  nickname: string | null;
  role: string;
};

type LoginResponse = {
  ok: boolean;
  token: string;
  user: AuthUser;
  error?: string;
};

type RegisterResponse = {
  ok: boolean;
  token: string;
  user: AuthUser;
  recoveryCode: string;
  error?: string;
};

type RecoveryVerifyResponse = {
  ok: boolean;
  recoveryToken: string;
  error?: string;
};

type RecoveryResetResponse = {
  ok: boolean;
  newRecoveryCode: string;
  error?: string;
};

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { username, password },
  });
}

export async function register(input: {
  username: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

export async function fetchMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/me');
}

export async function logout(): Promise<void> {
  await apiRequest<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
}

export async function verifyRecovery(input: {
  username: string;
  email: string;
  recoveryCode: string;
}): Promise<RecoveryVerifyResponse> {
  return apiRequest<RecoveryVerifyResponse>('/api/auth/recovery/verify', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

export async function resetPasswordWithRecovery(
  recoveryToken: string,
  newPassword: string,
): Promise<RecoveryResetResponse> {
  return apiRequest<RecoveryResetResponse>('/api/auth/recovery/reset', {
    method: 'POST',
    auth: false,
    body: { recoveryToken, newPassword },
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export async function regenerateRecoveryCode(
  currentPassword: string,
): Promise<{ ok: boolean; recoveryCode: string }> {
  return apiRequest<{ ok: boolean; recoveryCode: string }>('/api/auth/recovery-code/regenerate', {
    method: 'POST',
    body: { currentPassword },
  });
}

export function mapAuthErrorCode(code?: string): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return '아이디 또는 비밀번호가 올바르지 않습니다.';
    case 'USERNAME_ALREADY_EXISTS':
      return '이미 사용 중인 아이디입니다.';
    case 'EMAIL_ALREADY_EXISTS':
      return '이미 사용 중인 이메일입니다.';
    case 'PASSWORD_TOO_SHORT':
      return '비밀번호가 너무 짧습니다.';
    case 'INVALID_EMAIL':
      return '올바른 이메일을 입력해 주세요.';
    case 'RECOVERY_VERIFICATION_FAILED':
      return '복구 정보가 일치하지 않습니다.';
    case 'INVALID_CURRENT_PASSWORD':
      return '현재 비밀번호가 올바르지 않습니다.';
    default:
      return '요청을 처리할 수 없습니다.';
  }
}
