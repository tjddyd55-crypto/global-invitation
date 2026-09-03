export type TossEnvironment = 'TEST' | 'LIVE';

export type TossConnectionResult = {
  environment: TossEnvironment;
  ok: boolean;
  type: 'success' | 'error';
  code?: string;
  message: string;
  verification?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  PROVIDER_CREDENTIALS_INCOMPLETE:
    'Client Key와 Secret Key를 먼저 저장해 주세요. 연결 확인은 저장된 키 기준으로 수행됩니다.',
  TOSS_CREDENTIALS_INVALID:
    'Toss 인증 키가 올바르지 않습니다. TEST Client Key와 Secret Key 조합을 확인해 주세요.',
  TOSS_AUTH_FAILED:
    'Toss 인증 키가 올바르지 않습니다. TEST Client Key와 Secret Key 조합을 확인해 주세요.',
  TOSS_ENVIRONMENT_MISMATCH: '선택한 환경과 키 종류가 일치하지 않습니다. TEST 설정에는 TEST 키를 사용해 주세요.',
  TOSS_API_TIMEOUT: 'Toss 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
  TOSS_API_UNREACHABLE: 'Toss 서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  TOSS_CONNECTION_FAILED: 'Toss 서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  FOREIGN_MID_NOT_CONFIGURED: '저장된 Toss Secret Key가 없습니다. 먼저 키를 저장해 주세요.',
  PROVIDER_CONFIG_TEST_FAILED: '연결 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  INVALID_ENVIRONMENT: '잘못된 환경 값입니다.',
};

export function mapTossConnectionErrorCode(code: string | undefined, environment: TossEnvironment): string {
  if (!code) {
    return `Toss ${environment} 연결 확인에 실패했습니다.`;
  }
  if (code === 'TOSS_CREDENTIALS_INVALID' || code === 'TOSS_AUTH_FAILED') {
    return environment === 'LIVE'
      ? 'Toss 인증 키가 올바르지 않습니다. LIVE Client Key와 Secret Key 조합을 확인해 주세요.'
      : ERROR_MESSAGES.TOSS_CREDENTIALS_INVALID;
  }
  if (code === 'TOSS_ENVIRONMENT_MISMATCH') {
    return environment === 'LIVE'
      ? '선택한 환경과 키 종류가 일치하지 않습니다. LIVE 설정에는 LIVE 키를 사용해 주세요.'
      : ERROR_MESSAGES.TOSS_ENVIRONMENT_MISMATCH;
  }
  return ERROR_MESSAGES[code] || `Toss ${environment} 연결 확인에 실패했습니다. (${code})`;
}

export function normalizeTossConnectionTestResult(
  environment: TossEnvironment,
  status: number,
  payload: Record<string, unknown> | null
): TossConnectionResult {
  const code =
    (typeof payload?.code === 'string' && payload.code) ||
    (typeof payload?.error === 'string' && payload.error) ||
    undefined;
  const ok = Boolean(payload?.ok === true) && status >= 200 && status < 300;

  if (ok) {
    return {
      environment,
      ok: true,
      type: 'success',
      code: typeof payload?.code === 'string' ? payload.code : 'TOSS_AUTH_OK',
      message: `Toss ${environment} API 인증 연결이 확인되었습니다. 해외카드 USD 결제 가능 여부는 실제 TEST checkout QA가 필요합니다.`,
      verification:
        typeof payload?.verification === 'string' ? payload.verification : 'toss_api_auth',
    };
  }

  return {
    environment,
    ok: false,
    type: 'error',
    code,
    message: mapTossConnectionErrorCode(code, environment),
  };
}

export function missingCredentialsConnectionResult(
  environment: TossEnvironment
): TossConnectionResult {
  return {
    environment,
    ok: false,
    type: 'error',
    code: 'PROVIDER_CREDENTIALS_INCOMPLETE',
    message: mapTossConnectionErrorCode('PROVIDER_CREDENTIALS_INCOMPLETE', environment),
  };
}
