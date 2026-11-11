import prisma from '../prisma';
import { isValidUsdKrwRate } from '../payments/checkoutMethod';

export type SystemRuntimeSettings = {
  domesticKrwEnabled: boolean;
  usdKrwRate: number | null;
  paymentsEnabled: boolean;
  publishingEnabled: boolean;
  invitationCreationEnabled: boolean;
  signupsEnabled: boolean;
  supportEmail: string | null;
  activePaymentEnvironment: 'TEST' | 'LIVE';
  updatedBy: string | null;
  updatedAt: string | null;
};

const SYSTEM_ID = 'default';

let systemCache: { at: number; value: SystemRuntimeSettings } | null = null;
const SYSTEM_CACHE_MS = 5_000;

export function invalidateSystemConfigCache(): void {
  systemCache = null;
}

function defaults(): SystemRuntimeSettings {
  return {
    domesticKrwEnabled: envDomesticKrwEnabled(),
    usdKrwRate: envUsdKrwRate(),
    paymentsEnabled: true,
    publishingEnabled: true,
    invitationCreationEnabled: true,
    signupsEnabled: true,
    supportEmail: null,
    activePaymentEnvironment: 'TEST',
    updatedBy: null,
    updatedAt: null,
  };
}

/** Env bootstrap for domestic KRW checkout; admin DB values (non-null) take precedence. */
export function envDomesticKrwEnabled(): boolean {
  return (process.env.TOSS_DOMESTIC_KRW_ENABLED || '').trim().toLowerCase() === 'true';
}

export function envUsdKrwRate(): number | null {
  const raw = (process.env.TOSS_DOMESTIC_USD_KRW_RATE || '').trim();
  const rate = raw ? Number(raw) : NaN;
  return isValidUsdKrwRate(rate) ? rate : null;
}

function mapRow(row: {
  domesticKrwEnabled: boolean | null;
  usdKrwRate: number | null;
  paymentsEnabled: boolean;
  publishingEnabled: boolean;
  invitationCreationEnabled: boolean;
  signupsEnabled: boolean;
  supportEmail: string | null;
  activePaymentEnvironment: string;
  updatedBy: string | null;
  updatedAt: Date;
}): SystemRuntimeSettings {
  const env =
    row.activePaymentEnvironment.toUpperCase() === 'LIVE' ? 'LIVE' : 'TEST';
  return {
    domesticKrwEnabled: row.domesticKrwEnabled ?? envDomesticKrwEnabled(),
    usdKrwRate: row.usdKrwRate ?? envUsdKrwRate(),
    paymentsEnabled: row.paymentsEnabled,
    publishingEnabled: row.publishingEnabled,
    invitationCreationEnabled: row.invitationCreationEnabled,
    signupsEnabled: row.signupsEnabled,
    supportEmail: row.supportEmail,
    activePaymentEnvironment: env,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function ensureSystemConfigBootstrap(): Promise<void> {
  await prisma.systemRuntimeConfig.upsert({
    where: { id: SYSTEM_ID },
    create: { id: SYSTEM_ID },
    update: {},
  });
}

export async function getSystemRuntimeSettings(): Promise<SystemRuntimeSettings> {
  if (systemCache && Date.now() - systemCache.at < SYSTEM_CACHE_MS) {
    return systemCache.value;
  }
  try {
    await ensureSystemConfigBootstrap();
    const row = await prisma.systemRuntimeConfig.findUnique({ where: { id: SYSTEM_ID } });
    const value = row ? mapRow(row) : defaults();
    systemCache = { at: Date.now(), value };
    return value;
  } catch {
    const value = defaults();
    systemCache = { at: Date.now(), value };
    return value;
  }
}

export async function updateSystemRuntimeSettings(
  input: Partial<{
    domesticKrwEnabled: boolean;
    usdKrwRate: number | null;
    paymentsEnabled: boolean;
    publishingEnabled: boolean;
    invitationCreationEnabled: boolean;
    signupsEnabled: boolean;
    supportEmail: string | null;
    activePaymentEnvironment: 'TEST' | 'LIVE';
  }>,
  updatedBy: string
): Promise<SystemRuntimeSettings> {
  if (input.usdKrwRate != null && !isValidUsdKrwRate(input.usdKrwRate)) throw new Error('INVALID_USD_KRW_RATE');
  await ensureSystemConfigBootstrap();
  const row = await prisma.systemRuntimeConfig.update({
    where: { id: SYSTEM_ID },
    data: {
      ...(input.domesticKrwEnabled !== undefined ? { domesticKrwEnabled: input.domesticKrwEnabled } : {}),
      ...(input.usdKrwRate !== undefined ? { usdKrwRate: input.usdKrwRate } : {}),
      ...(typeof input.paymentsEnabled === 'boolean'
        ? { paymentsEnabled: input.paymentsEnabled }
        : {}),
      ...(typeof input.publishingEnabled === 'boolean'
        ? { publishingEnabled: input.publishingEnabled }
        : {}),
      ...(typeof input.invitationCreationEnabled === 'boolean'
        ? { invitationCreationEnabled: input.invitationCreationEnabled }
        : {}),
      ...(typeof input.signupsEnabled === 'boolean' ? { signupsEnabled: input.signupsEnabled } : {}),
      ...(input.supportEmail !== undefined ? { supportEmail: input.supportEmail } : {}),
      ...(input.activePaymentEnvironment
        ? { activePaymentEnvironment: input.activePaymentEnvironment }
        : {}),
      updatedBy,
    },
  });
  invalidateSystemConfigCache();
  return mapRow(row);
}

export function resolveRuntimeAppEnvironment(): 'development' | 'production' | 'unknown' {
  const railway = (process.env.RAILWAY_ENVIRONMENT_NAME || '').trim().toLowerCase();
  if (railway === 'production') return 'production';
  if (railway === 'development' || railway === 'dev') return 'development';
  if ((process.env.NODE_ENV || '').toLowerCase() === 'production') return 'production';
  if ((process.env.NODE_ENV || '').toLowerCase() === 'development') return 'development';
  return 'unknown';
}
