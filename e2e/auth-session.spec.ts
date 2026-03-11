import { expect, request, test, type APIRequestContext } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3001';

async function ensureTestLogin(api: APIRequestContext, email = 'test@example.com') {
  const response = await api.post('/api/test-login', {
    data: { email },
  });
  expect(response.ok()).toBeTruthy();
  return response;
}

test.describe('인증/세션 검증', () => {
  test('유효하지 않은 세션 토큰 요청은 AUTH_REQUIRED를 반환해야 함', async () => {
    const anonContext = await request.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: {
        Authorization: 'Bearer invalid-session-token',
      },
    });
    try {
      const response = await anonContext.post('/api/media/presign', {
        data: {
          folder: 'e2e/users/self',
          contentType: 'image/png',
        },
      });

      expect(response.status()).toBe(401);
      const payload = (await response.json()) as { error?: string };
      expect(payload.error).toBe('AUTH_REQUIRED');
    } finally {
      await anonContext.dispose();
    }
  });

  test('test-login 이후 세션 쿠키가 저장되고 인증 API 접근이 가능해야 함', async () => {
    const authContext = await request.newContext({ baseURL: API_BASE_URL });
    try {
      await ensureTestLogin(authContext);

      const storage = await authContext.storageState();
      const hasAuthCookie = storage.cookies.some((cookie) => cookie.name === 'auth_session_token');
      expect(hasAuthCookie).toBeTruthy();

      const presignResponse = await authContext.post('/api/media/presign', {
        data: {
          folder: 'e2e/users/self',
          contentType: 'image/png',
        },
      });
      expect(presignResponse.ok()).toBeTruthy();

      const presignPayload = (await presignResponse.json()) as { uploadUrl: string; fileKey: string };
      expect(presignPayload.uploadUrl).toContain('cloudflarestorage.com');
      expect(presignPayload.fileKey).toContain('.upload');
    } finally {
      await authContext.dispose();
    }
  });
});
