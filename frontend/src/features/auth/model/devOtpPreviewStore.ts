/**
 * development mock OTP previewCode 메모리 전달.
 * URL/localStorage/analytics 에 넣지 않는다.
 */
const STORAGE_KEY = 'gi_dev_otp_preview_v1';

let memoryPreviewCode: string | null = null;

function isSixDigitCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function saveDevOtpPreviewCode(code: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const normalized = typeof code === 'string' ? code.trim() : '';
  if (!isSixDigitCode(normalized)) {
    clearDevOtpPreviewCode();
    return;
  }
  memoryPreviewCode = normalized;
  window.sessionStorage.setItem(STORAGE_KEY, normalized);
}

export function readDevOtpPreviewCode(): string | null {
  if (typeof window === 'undefined') return null;
  if (memoryPreviewCode && isSixDigitCode(memoryPreviewCode)) {
    return memoryPreviewCode;
  }
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (stored && isSixDigitCode(stored)) {
    memoryPreviewCode = stored;
    return stored;
  }
  return null;
}

/** Verify 진입 시 sessionStorage 는 즉시 지우고, 반환값으로 UI 상태를 채운다. */
export function consumeDevOtpPreviewCode(): string | null {
  const code = readDevOtpPreviewCode();
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }
  memoryPreviewCode = code;
  return code;
}

export function clearDevOtpPreviewCode(): void {
  memoryPreviewCode = null;
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
