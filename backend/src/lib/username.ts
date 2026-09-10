const USERNAME_MIN_LENGTH = 4;
const USERNAME_MAX_LENGTH = 30;
const USERNAME_PATTERN = /^[a-z0-9_-]+$/;

export type UsernameValidationError =
  | 'USERNAME_REQUIRED'
  | 'USERNAME_TOO_SHORT'
  | 'USERNAME_TOO_LONG'
  | 'USERNAME_INVALID_FORMAT';

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): UsernameValidationError | null {
  const normalized = normalizeUsername(value);
  if (!normalized) {
    return 'USERNAME_REQUIRED';
  }
  if (normalized.length < USERNAME_MIN_LENGTH) {
    return 'USERNAME_TOO_SHORT';
  }
  if (normalized.length > USERNAME_MAX_LENGTH) {
    return 'USERNAME_TOO_LONG';
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'USERNAME_INVALID_FORMAT';
  }
  return null;
}

export function getUsernameMinLength(): number {
  return USERNAME_MIN_LENGTH;
}

export function getUsernameMaxLength(): number {
  return USERNAME_MAX_LENGTH;
}
