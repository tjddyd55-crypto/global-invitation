import crypto from 'crypto';
import { promisify } from 'util';

const HASH_VERSION = 'scrypt:v1';
const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const scryptAsync = promisify(crypto.scrypt);

export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  if (!normalized) {
    throw new Error('PASSWORD_REQUIRED');
  }

  const salt = crypto.randomBytes(SALT_BYTES);
  const derivedKey = (await scryptAsync(normalized, salt, KEY_LENGTH)) as Buffer;
  return `${HASH_VERSION}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const normalized = password.trim();
  if (!normalized || !encodedHash) {
    return false;
  }

  const [version, saltHex, keyHex] = encodedHash.split('$');
  if (version !== HASH_VERSION || !saltHex || !keyHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, 'hex');
  const expectedKey = Buffer.from(keyHex, 'hex');
  if (expectedKey.length === 0) {
    return false;
  }

  const derivedKey = (await scryptAsync(normalized, salt, expectedKey.length)) as Buffer;
  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, expectedKey);
}
