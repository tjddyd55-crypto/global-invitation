import { S3Client } from '@aws-sdk/client-s3';

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
  endpoint: string;
  region: string;
};

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  const httpsNormalized = trimmed.startsWith('http://')
    ? trimmed.replace('http://', 'https://')
    : trimmed;
  return httpsNormalized.endsWith('/') ? httpsNormalized.slice(0, -1) : httpsNormalized;
}

function isInvalidSecretValue(value: string): boolean {
  if (!value) return true;
  const normalized = value.trim();
  return normalized.startsWith('<') && normalized.endsWith('>');
}

export function resolveR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
  const bucketName = process.env.R2_BUCKET_NAME?.trim() || '';
  const publicUrlRaw = process.env.R2_PUBLIC_BASE_URL?.trim() || '';
  const publicUrl = publicUrlRaw ? normalizeBaseUrl(publicUrlRaw) : '';
  const region = process.env.R2_REGION?.trim() || 'auto';
  const endpoint =
    process.env.R2_ENDPOINT?.trim() || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');

  if (
    !accountId ||
    !bucketName ||
    !publicUrl ||
    !endpoint ||
    isInvalidSecretValue(accessKeyId) ||
    isInvalidSecretValue(secretAccessKey)
  ) {
    throw new Error('R2_STORAGE_NOT_CONFIGURED');
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
    endpoint,
    region,
  };
}

export const r2Client = new S3Client({
  region: process.env.R2_REGION?.trim() || 'auto',
  endpoint:
    process.env.R2_ENDPOINT?.trim() ||
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export function buildPublicFileUrl(key: string): string {
  const config = resolveR2Config();
  return `${config.publicUrl}/${key}`;
}

export function resolveKeyFromPublicUrl(fileUrl: string): string | null {
  if (!fileUrl) return null;
  const config = resolveR2Config();
  if (!fileUrl.startsWith(config.publicUrl)) {
    return null;
  }
  const withoutQuery = fileUrl.split('?')[0].split('#')[0];
  const key = withoutQuery.slice(config.publicUrl.length).replace(/^\/+/, '');
  return key || null;
}
