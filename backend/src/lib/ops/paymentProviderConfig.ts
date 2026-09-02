import { PaymentProviderEnvironment } from '@prisma/client';
import prisma from '../prisma';
import {
  decryptSecretFromJson,
  encryptSecretToJson,
  fingerprintSecret,
  isAdminSettingsEncryptionConfigured,
  maskSecret,
} from '../security/adminSettingsCrypto';
import { getSystemRuntimeSettings, resolveRuntimeAppEnvironment } from './systemConfig';

export type ProviderEnvironment = 'TEST' | 'LIVE';

export type MaskedProviderConfigView = {
  provider: 'toss_payments';
  environment: ProviderEnvironment;
  enabled: boolean;
  clientKeyConfigured: boolean;
  secretKeyConfigured: boolean;
  variantKeyConfigured: boolean;
  clientKeyMasked: string | null;
  secretKeyMasked: string | null;
  variantKeyMasked: string | null;
  clientKeyFingerprint: string | null;
  secretKeyFingerprint: string | null;
  variantKeyFingerprint: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ResolvedTossCredentials = {
  source: 'db' | 'env';
  environment: ProviderEnvironment;
  clientKey: string;
  secretKey: string;
  variantKey: string | null;
};

function toEnvEnum(value: ProviderEnvironment): PaymentProviderEnvironment {
  return value === 'LIVE'
    ? PaymentProviderEnvironment.LIVE
    : PaymentProviderEnvironment.TEST;
}

async function loadRow(environment: ProviderEnvironment) {
  return prisma.paymentProviderConfig.findUnique({
    where: {
      provider_environment: {
        provider: 'toss_payments',
        environment: toEnvEnum(environment),
      },
    },
  });
}

export function deserializeStoredValue(serialized: string | null | undefined): string | null {
  if (!serialized?.trim()) return null;
  try {
    const parsed = JSON.parse(serialized) as { v?: number; pt?: string };
    if (parsed.v === 0 && typeof parsed.pt === 'string') {
      return parsed.pt;
    }
  } catch {
    // fall through to encrypted blob
  }
  try {
    return decryptSecretFromJson(serialized);
  } catch {
    return null;
  }
}

export function serializeStoredValue(
  plaintext: string,
  options: { requireEncryption: boolean }
): string {
  if (options.requireEncryption || isAdminSettingsEncryptionConfigured()) {
    return encryptSecretToJson(plaintext);
  }
  return JSON.stringify({ v: 0, pt: plaintext });
}

function safeDecrypt(serialized: string | null | undefined): string | null {
  return deserializeStoredValue(serialized);
}

export async function getMaskedProviderConfig(
  environment: ProviderEnvironment
): Promise<MaskedProviderConfigView> {
  const row = await loadRow(environment);
  const client = safeDecrypt(row?.encryptedClientKey);
  const secret = safeDecrypt(row?.encryptedSecretKey);
  const variant = safeDecrypt(row?.encryptedVariantKey);
  return {
    provider: 'toss_payments',
    environment,
    enabled: Boolean(row?.enabled),
    clientKeyConfigured: Boolean(client),
    secretKeyConfigured: Boolean(secret),
    variantKeyConfigured: Boolean(variant),
    clientKeyMasked: maskSecret(client),
    secretKeyMasked: maskSecret(secret),
    variantKeyMasked: maskSecret(variant),
    clientKeyFingerprint: row?.clientKeyFingerprint ?? null,
    secretKeyFingerprint: row?.secretKeyFingerprint ?? null,
    variantKeyFingerprint: row?.variantKeyFingerprint ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
    updatedBy: row?.updatedBy ?? null,
  };
}

export async function upsertProviderConfig(input: {
  environment: ProviderEnvironment;
  enabled?: boolean;
  clientKey?: string | null;
  secretKey?: string | null;
  variantKey?: string | null;
  updatedBy: string;
}): Promise<{
  view: MaskedProviderConfigView;
  secretChanged: boolean;
  clientChanged: boolean;
  variantChanged: boolean;
}> {
  const clientChanged = Boolean(input.clientKey?.trim());
  const secretChanged = Boolean(input.secretKey?.trim());
  const variantChanged = input.variantKey !== undefined;
  const hasChanges =
    clientChanged || secretChanged || variantChanged || typeof input.enabled === 'boolean';

  if (!hasChanges) {
    throw new Error('PROVIDER_CONFIG_NOTHING_TO_SAVE');
  }

  if (secretChanged && !isAdminSettingsEncryptionConfigured()) {
    throw new Error('ADMIN_SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED');
  }

  const existing = await loadRow(input.environment);
  const nextClient =
    input.clientKey && input.clientKey.trim()
      ? input.clientKey.trim()
      : safeDecrypt(existing?.encryptedClientKey);
  const nextSecret =
    input.secretKey && input.secretKey.trim()
      ? input.secretKey.trim()
      : safeDecrypt(existing?.encryptedSecretKey);
  const nextVariant =
    input.variantKey !== undefined
      ? input.variantKey?.trim() || null
      : safeDecrypt(existing?.encryptedVariantKey);

  const row = await prisma.paymentProviderConfig.upsert({
    where: {
      provider_environment: {
        provider: 'toss_payments',
        environment: toEnvEnum(input.environment),
      },
    },
    create: {
      provider: 'toss_payments',
      environment: toEnvEnum(input.environment),
      enabled: Boolean(input.enabled),
      encryptedClientKey: nextClient
        ? serializeStoredValue(nextClient, { requireEncryption: false })
        : null,
      encryptedSecretKey: nextSecret
        ? serializeStoredValue(nextSecret, { requireEncryption: true })
        : null,
      encryptedVariantKey: nextVariant
        ? serializeStoredValue(nextVariant, { requireEncryption: false })
        : null,
      clientKeyFingerprint: nextClient ? fingerprintSecret(nextClient) : null,
      secretKeyFingerprint: nextSecret ? fingerprintSecret(nextSecret) : null,
      variantKeyFingerprint: nextVariant ? fingerprintSecret(nextVariant) : null,
      updatedBy: input.updatedBy,
    },
    update: {
      ...(typeof input.enabled === 'boolean' ? { enabled: input.enabled } : {}),
      ...(clientChanged && nextClient
        ? {
            encryptedClientKey: serializeStoredValue(nextClient, { requireEncryption: false }),
            clientKeyFingerprint: fingerprintSecret(nextClient),
          }
        : {}),
      ...(secretChanged && nextSecret
        ? {
            encryptedSecretKey: serializeStoredValue(nextSecret, { requireEncryption: true }),
            secretKeyFingerprint: fingerprintSecret(nextSecret),
          }
        : {}),
      ...(variantChanged
        ? {
            encryptedVariantKey: nextVariant
              ? serializeStoredValue(nextVariant, { requireEncryption: false })
              : null,
            variantKeyFingerprint: nextVariant ? fingerprintSecret(nextVariant) : null,
          }
        : {}),
      updatedBy: input.updatedBy,
    },
  });

  void row;
  const view = await getMaskedProviderConfig(input.environment);
  return { view, secretChanged, clientChanged, variantChanged };
}

/**
 * Resolve Toss credentials for runtime charges.
 * Precedence: Admin DB (active env, enabled) → Railway env fallback.
 * Development blocks LIVE charge credentials.
 */
export async function resolveTossCredentialsForRuntime(): Promise<
  | { ok: true; credentials: ResolvedTossCredentials }
  | { ok: false; code: string; message: string }
> {
  const system = await getSystemRuntimeSettings();
  const appEnv = resolveRuntimeAppEnvironment();
  let environment = system.activePaymentEnvironment;

  if (appEnv !== 'production' && environment === 'LIVE') {
    return {
      ok: false,
      code: 'LIVE_PAYMENT_BLOCKED_IN_DEVELOPMENT',
      message:
        'LIVE payment environment is blocked outside production. Switch activePaymentEnvironment to TEST.',
    };
  }

  const row = await loadRow(environment);
  if (row?.enabled) {
    const clientKey = safeDecrypt(row.encryptedClientKey) || '';
    const secretKey = safeDecrypt(row.encryptedSecretKey) || '';
    const variantKey = safeDecrypt(row.encryptedVariantKey);
    if (clientKey && secretKey) {
      return {
        ok: true,
        credentials: {
          source: 'db',
          environment,
          clientKey,
          secretKey,
          variantKey,
        },
      };
    }
    if (row.enabled && (!clientKey || !secretKey)) {
      return {
        ok: false,
        code: 'PAYMENT_PROVIDER_CONFIG_INVALID',
        message: 'Admin Toss config is enabled but credentials are incomplete or undecryptable.',
      };
    }
  }

  const envClient =
    process.env.TOSS_PAYMENTS_CLIENT_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY?.trim() ||
    '';
  const envSecret = process.env.TOSS_PAYMENTS_SECRET_KEY?.trim() || '';
  const envVariant =
    process.env.TOSS_PAYMENTS_VARIANT_KEY?.trim() ||
    process.env.NEXT_PUBLIC_TOSS_PAYMENTS_VARIANT_KEY?.trim() ||
    '';

  if (envClient && envSecret) {
    const envIsLive = envClient.startsWith('live_') || envSecret.startsWith('live_');
    if (appEnv !== 'production' && envIsLive) {
      return {
        ok: false,
        code: 'LIVE_PAYMENT_BLOCKED_IN_DEVELOPMENT',
        message: 'LIVE Toss env keys are forbidden outside production.',
      };
    }
    return {
      ok: true,
      credentials: {
        source: 'env',
        environment: envIsLive ? 'LIVE' : 'TEST',
        clientKey: envClient,
        secretKey: envSecret,
        variantKey: envVariant || null,
      },
    };
  }

  return {
    ok: false,
    code: 'FOREIGN_MID_NOT_CONFIGURED',
    message: 'Toss USD credentials are not configured in Admin DB or environment.',
  };
}
