import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;

export type EncryptedBlob = {
  v: 1;
  iv: string;
  tag: string;
  ct: string;
};

function resolveEncryptionKey(): Buffer | null {
  const raw = process.env.ADMIN_SETTINGS_ENCRYPTION_KEY?.trim() || '';
  if (!raw) return null;

  // Prefer 64-char hex (32 bytes) or base64 of 32 bytes.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === KEY_BYTES) return buf;
  } catch {
    // fall through
  }
  // Derive stable 32-byte key from arbitrary secret string (dev convenience only).
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

export function isAdminSettingsEncryptionConfigured(): boolean {
  return Boolean(resolveEncryptionKey());
}

export function encryptSecret(plaintext: string): EncryptedBlob {
  const key = resolveEncryptionKey();
  if (!key) {
    throw new Error('ADMIN_SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED');
  }
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: encrypted.toString('base64'),
  };
}

export function encryptSecretToJson(plaintext: string): string {
  return JSON.stringify(encryptSecret(plaintext));
}

export function decryptSecretFromJson(serialized: string | null | undefined): string | null {
  if (!serialized?.trim()) return null;
  let blob: EncryptedBlob;
  try {
    blob = JSON.parse(serialized) as EncryptedBlob;
  } catch {
    throw new Error('ENCRYPTED_BLOB_INVALID');
  }
  if (blob.v !== 1 || !blob.iv || !blob.tag || !blob.ct) {
    throw new Error('ENCRYPTED_BLOB_INVALID');
  }
  const key = resolveEncryptionKey();
  if (!key) {
    throw new Error('ADMIN_SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED');
  }
  const iv = Buffer.from(blob.iv, 'base64');
  const tag = Buffer.from(blob.tag, 'base64');
  const ct = Buffer.from(blob.ct, 'base64');
  if (tag.length !== AUTH_TAG_BYTES) {
    throw new Error('ENCRYPTED_BLOB_INVALID');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ct), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Mask for admin UI: keep short prefix + last 4 chars. */
export function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.slice(0, Math.min(8, trimmed.indexOf('_') > 0 ? trimmed.indexOf('_') + 1 : 4));
  const suffix = trimmed.slice(-4);
  return `${prefix}${'•'.repeat(8)}${suffix}`;
}

export function fingerprintSecret(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 16);
}
