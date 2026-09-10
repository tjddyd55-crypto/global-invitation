import crypto from 'crypto';

/** 혼동 문자(0/O, 1/I/L) 제외 */
const RECOVERY_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RECOVERY_CODE_SEGMENT_LENGTH = 4;
const RECOVERY_CODE_SEGMENT_COUNT = 4;

function resolveRecoveryCodePepper(): string {
  return (
    process.env.RECOVERY_CODE_PEPPER ||
    process.env.AUTH_CODE_PEPPER ||
    process.env.EMAIL_CODE_PEPPER ||
    'dev-recovery-code-pepper'
  );
}

function randomSegment(): string {
  let segment = '';
  for (let i = 0; i < RECOVERY_CODE_SEGMENT_LENGTH; i += 1) {
    const index = crypto.randomInt(0, RECOVERY_CODE_CHARSET.length);
    segment += RECOVERY_CODE_CHARSET[index];
  }
  return segment;
}

export function generateRecoveryCode(): string {
  const segments = Array.from({ length: RECOVERY_CODE_SEGMENT_COUNT }, () => randomSegment());
  return segments.join('-');
}

export function normalizeRecoveryCodeInput(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function hashRecoveryCode(code: string): string {
  const normalized = normalizeRecoveryCodeInput(code);
  return crypto
    .createHash('sha256')
    .update(`${resolveRecoveryCodePepper()}:${normalized}`)
    .digest('hex');
}

export function verifyRecoveryCode(code: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) {
    return false;
  }
  const computed = hashRecoveryCode(code);
  const left = Buffer.from(computed, 'utf8');
  const right = Buffer.from(storedHash, 'utf8');
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}
