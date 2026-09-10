import crypto from 'crypto';
import prisma from './prisma';
import { createToken, resolveFrontendBaseUrl } from './auth';
import { generateRecoveryCode, hashRecoveryCode } from './recoveryCode';
import { hashPassword } from './password';

export const RECOVERY_GRANT_TYPE = 'RECOVERY_CODE';
export const ADMIN_RESET_TYPE = 'ADMIN_RESET';

const RECOVERY_GRANT_TTL_MINUTES = 15;
const ADMIN_RESET_TTL_MINUTES = 30;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

function resolveTokenPepper(): string {
  return (
    process.env.PASSWORD_RECOVERY_PEPPER ||
    process.env.AUTH_CODE_PEPPER ||
    'dev-password-recovery-pepper'
  );
}

export function generateRecoveryGrantToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashRecoveryGrantToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(`${resolveTokenPepper()}:${token}`)
    .digest('hex');
}

export function getRecoveryGrantExpiry(): Date {
  return new Date(Date.now() + RECOVERY_GRANT_TTL_MINUTES * 60 * 1000);
}

export function getAdminResetExpiry(): Date {
  return new Date(Date.now() + ADMIN_RESET_TTL_MINUTES * 60 * 1000);
}

export function validatePasswordLength(password: string): boolean {
  const trimmed = password.trim();
  return trimmed.length >= MIN_PASSWORD_LENGTH && trimmed.length <= MAX_PASSWORD_LENGTH;
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function issueRecoveryCodeForUser(userId: string): Promise<string> {
  const code = generateRecoveryCode();
  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      recoveryCodeHash: hashRecoveryCode(code),
      recoveryCodeIssuedAt: now,
    },
  });
  return code;
}

export async function invalidateUnusedRecoveryTokens(
  userId: string,
  type: string
): Promise<void> {
  await prisma.passwordRecoveryToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export async function createRecoveryGrant(userId: string): Promise<string> {
  await invalidateUnusedRecoveryTokens(userId, RECOVERY_GRANT_TYPE);
  const token = generateRecoveryGrantToken();
  await prisma.passwordRecoveryToken.create({
    data: {
      userId,
      tokenHash: hashRecoveryGrantToken(token),
      type: RECOVERY_GRANT_TYPE,
      expiresAt: getRecoveryGrantExpiry(),
    },
  });
  return token;
}

export async function createAdminResetToken(
  userId: string,
  adminId: string
): Promise<{ token: string; tokenId: string }> {
  await invalidateUnusedRecoveryTokens(userId, ADMIN_RESET_TYPE);
  const token = generateRecoveryGrantToken();
  const record = await prisma.passwordRecoveryToken.create({
    data: {
      userId,
      tokenHash: hashRecoveryGrantToken(token),
      type: ADMIN_RESET_TYPE,
      expiresAt: getAdminResetExpiry(),
      createdByAdminId: adminId,
    },
  });
  return { token, tokenId: record.id };
}

export function buildAdminResetUrl(token: string): string {
  const baseUrl = resolveFrontendBaseUrl();
  const url = new URL('/reset-password', baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

type RecoveryTokenRecord = {
  id: string;
  userId: string;
  type: string;
  expiresAt: Date;
  usedAt: Date | null;
};

async function findValidRecoveryToken(
  token: string,
  expectedType: string
): Promise<RecoveryTokenRecord | null> {
  const tokenHash = hashRecoveryGrantToken(token);
  const record = await prisma.passwordRecoveryToken.findFirst({
    where: { tokenHash, type: expectedType },
    select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true },
  });
  if (!record) {
    return null;
  }
  if (record.usedAt) {
    return null;
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return null;
  }
  return record;
}

export async function resetPasswordWithRecoveryToken(params: {
  token: string;
  newPassword: string;
  expectedType: string;
  revokeOtherSessions: boolean;
  rotateRecoveryCode: boolean;
}): Promise<{ newRecoveryCode: string }> {
  const { token, newPassword, expectedType, revokeOtherSessions, rotateRecoveryCode } = params;

  if (!validatePasswordLength(newPassword)) {
    throw new Error('PASSWORD_TOO_SHORT');
  }

  const record = await findValidRecoveryToken(token, expectedType);
  if (!record) {
    throw new Error('INVALID_OR_EXPIRED_TOKEN');
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();
  const newRecoveryCode = rotateRecoveryCode ? generateRecoveryCode() : '';

  await prisma.$transaction(async (tx) => {
    await tx.passwordRecoveryToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
    await tx.passwordRecoveryToken.updateMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
      data: { usedAt: now },
    });
    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        passwordChangedAt: now,
        ...(rotateRecoveryCode
          ? {
              recoveryCodeHash: hashRecoveryCode(newRecoveryCode),
              recoveryCodeIssuedAt: now,
            }
          : {}),
      },
    });
  });

  if (revokeOtherSessions) {
    await revokeAllUserSessions(record.userId);
  }

  return { newRecoveryCode };
}

export async function changePasswordForUser(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  keepCurrentSessionToken?: string | null;
}): Promise<void> {
  const { userId, currentPassword, newPassword, keepCurrentSessionToken } = params;

  if (!validatePasswordLength(newPassword)) {
    throw new Error('PASSWORD_TOO_SHORT');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    throw new Error('PASSWORD_NOT_SET');
  }

  const { verifyPassword } = await import('./password');
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CURRENT_PASSWORD');
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: now },
  });

  if (keepCurrentSessionToken) {
    await prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        token: { not: keepCurrentSessionToken },
      },
      data: { revokedAt: now },
    });
  } else {
    await revokeAllUserSessions(userId);
  }
}

export function createSessionToken(): string {
  return createToken();
}
