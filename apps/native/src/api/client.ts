import { buildApiUrl } from '@/src/config/environment';
import { loadStoredToken, removeStoredToken, useAuthStore } from '@/src/stores/authStore';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let unauthorizedHandler: (() => void) | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

async function resolveAuthToken(): Promise<string | null> {
  const fromStore = useAuthStore.getState().token;
  if (fromStore) return fromStore;
  return loadStoredToken();
}

async function handleUnauthorized(): Promise<void> {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  try {
    await removeStoredToken();
    useAuthStore.getState().clearSession();
    unauthorizedHandler?.();
  } finally {
    handlingUnauthorized = false;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, timeoutMs = 30000, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = await resolveAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildApiUrl(path), {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (response.status === 401 && auth) {
      await handleUnauthorized();
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const text = await response.text();
    const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (!response.ok) {
      const code = typeof data.error === 'string' ? data.error : undefined;
      const message =
        typeof data.message === 'string'
          ? data.message
          : code ?? `Request failed (${response.status})`;
      throw new ApiError(message, response.status, code);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('요청 시간이 초과되었습니다.', 408, 'TIMEOUT');
    }
    throw new ApiError('네트워크 오류가 발생했습니다.', 0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiUpload(
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const fileResponse = await fetch(fileUri);
  const blob = await fileResponse.blob();

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!response.ok) {
    throw new ApiError('파일 업로드에 실패했습니다.', response.status, 'UPLOAD_FAILED');
  }
}
