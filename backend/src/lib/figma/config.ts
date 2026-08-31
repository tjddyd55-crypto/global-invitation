/**
 * Figma access token config — DB encrypted → FIGMA_ACCESS_TOKEN env fallback.
 * Reuses ADMIN_SETTINGS_ENCRYPTION_KEY (Phase 1). Never returns full token to clients.
 */
import prisma from '../prisma';
import {
  decryptSecretFromJson,
  encryptSecretToJson,
  fingerprintSecret,
  isAdminSettingsEncryptionConfigured,
  maskSecret,
} from '../security/adminSettingsCrypto';

const CONFIG_ID = 'default';

export type FigmaConfigView = {
  configured: boolean;
  source: 'db' | 'env' | 'none';
  encryptionConfigured: boolean;
  tokenMasked: string | null;
  tokenFingerprint: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

function envToken(): string | null {
  const raw = process.env.FIGMA_ACCESS_TOKEN?.trim();
  return raw || null;
}

function safeDecrypt(serialized: string | null | undefined): string | null {
  if (!serialized) return null;
  try {
    return decryptSecretFromJson(serialized);
  } catch {
    return null;
  }
}

export async function getFigmaConfigView(): Promise<FigmaConfigView> {
  const row = await prisma.figmaIntegrationConfig.findUnique({ where: { id: CONFIG_ID } });
  const dbToken = safeDecrypt(row?.encryptedAccessToken);
  const fallback = envToken();
  const encryptionConfigured = isAdminSettingsEncryptionConfigured();

  if (dbToken) {
    return {
      configured: true,
      source: 'db',
      encryptionConfigured,
      tokenMasked: maskSecret(dbToken),
      tokenFingerprint: row?.tokenFingerprint ?? fingerprintSecret(dbToken),
      updatedAt: row?.updatedAt?.toISOString() ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  }
  if (fallback) {
    return {
      configured: true,
      source: 'env',
      encryptionConfigured,
      tokenMasked: maskSecret(fallback),
      tokenFingerprint: fingerprintSecret(fallback),
      updatedAt: null,
      updatedBy: null,
    };
  }
  return {
    configured: false,
    source: 'none',
    encryptionConfigured,
    tokenMasked: null,
    tokenFingerprint: null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
    updatedBy: row?.updatedBy ?? null,
  };
}

/** Resolve token for server-side Figma API calls. Never expose to frontend. */
export async function resolveFigmaAccessToken(): Promise<{
  token: string;
  source: 'db' | 'env';
} | null> {
  const row = await prisma.figmaIntegrationConfig.findUnique({ where: { id: CONFIG_ID } });
  const dbToken = safeDecrypt(row?.encryptedAccessToken);
  if (dbToken) return { token: dbToken, source: 'db' };
  const fallback = envToken();
  if (fallback) return { token: fallback, source: 'env' };
  return null;
}

export async function upsertFigmaAccessToken(input: {
  accessToken: string;
  updatedBy: string;
}): Promise<FigmaConfigView> {
  if (!isAdminSettingsEncryptionConfigured()) {
    throw new Error('ADMIN_SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED');
  }
  const token = input.accessToken.trim();
  if (!token) throw new Error('FIGMA_TOKEN_REQUIRED');

  await prisma.figmaIntegrationConfig.upsert({
    where: { id: CONFIG_ID },
    create: {
      id: CONFIG_ID,
      encryptedAccessToken: encryptSecretToJson(token),
      tokenFingerprint: fingerprintSecret(token),
      updatedBy: input.updatedBy,
    },
    update: {
      encryptedAccessToken: encryptSecretToJson(token),
      tokenFingerprint: fingerprintSecret(token),
      updatedBy: input.updatedBy,
    },
  });

  return getFigmaConfigView();
}

export async function clearFigmaAccessToken(updatedBy: string): Promise<FigmaConfigView> {
  await prisma.figmaIntegrationConfig.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, encryptedAccessToken: null, tokenFingerprint: null, updatedBy },
    update: { encryptedAccessToken: null, tokenFingerprint: null, updatedBy },
  });
  return getFigmaConfigView();
}
