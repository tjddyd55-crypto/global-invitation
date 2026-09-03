export const FIGMA_RUNTIME_IMPORT_SCOPES = ['file_content:read', 'file_metadata:read'] as const;

export type FigmaConnectionResult = {
  ok: boolean;
  type: 'success' | 'error';
  code?: string;
  message: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  FIGMA_TOKEN_NOT_CONFIGURED:
    'Figma Access Token이 설정되지 않았습니다. 토큰을 저장한 뒤 다시 시도해 주세요.',
  FIGMA_TOKEN_INVALID:
    'Figma Access Token이 유효하지 않습니다. Figma에서 새 토큰을 생성해 다시 저장해 주세요.',
  FIGMA_SCOPE_INSUFFICIENT:
    'Figma Access Token 권한이 부족합니다. file_content:read, file_metadata:read 권한을 포함해 토큰을 다시 생성해 주세요.',
  FIGMA_API_FORBIDDEN:
    '이 토큰으로 해당 Figma 리소스에 접근할 권한이 없습니다. 파일 공유 권한을 확인해 주세요.',
  FIGMA_UNAUTHORIZED:
    'Figma Access Token이 유효하지 않거나 권한이 부족합니다. 토큰과 권한을 확인해 주세요.',
  FIGMA_API_TIMEOUT: 'Figma 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
  FIGMA_API_UNREACHABLE: 'Figma 서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  FIGMA_RATE_LIMITED: 'Figma API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
  FIGMA_TEST_FAILED: '연결 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
};

export function mapFigmaConnectionErrorCode(code: string | undefined): string {
  if (!code) return 'Figma 연결 확인에 실패했습니다.';
  return ERROR_MESSAGES[code] || `Figma 연결 확인에 실패했습니다. (${code})`;
}

export function normalizeFigmaConnectionTestResult(
  status: number,
  payload: Record<string, unknown> | null
): FigmaConnectionResult {
  const code =
    (typeof payload?.code === 'string' && payload.code) ||
    (typeof payload?.error === 'string' && payload.error) ||
    undefined;
  const ok = Boolean(payload?.ok === true) && status >= 200 && status < 300;

  if (ok) {
    return {
      ok: true,
      type: 'success',
      code: typeof payload?.code === 'string' ? payload.code : 'FIGMA_AUTH_OK',
      message:
        'Figma API 인증 연결이 확인되었습니다. 개별 파일 접근 권한은 파일 공유 설정에 따라 달라질 수 있습니다.',
    };
  }

  return {
    ok: false,
    type: 'error',
    code,
    message: mapFigmaConnectionErrorCode(code),
  };
}

export function missingFigmaTokenConnectionResult(): FigmaConnectionResult {
  return {
    ok: false,
    type: 'error',
    code: 'FIGMA_TOKEN_NOT_CONFIGURED',
    message: mapFigmaConnectionErrorCode('FIGMA_TOKEN_NOT_CONFIGURED'),
  };
}

export function formatFigmaScopeHelper(): string {
  return FIGMA_RUNTIME_IMPORT_SCOPES.map((scope) => `• ${scope}`).join('\n');
}
