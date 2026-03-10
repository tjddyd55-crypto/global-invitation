import { S3Client } from '@aws-sdk/client-s3';

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
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
  const publicUrl = normalizeBaseUrl(process.env.R2_PUBLIC_URL?.trim() || '');

  if (
    !accountId ||
    !bucketName ||
    !publicUrl ||
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
  };
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
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
  const key = fileUrl.slice(config.publicUrl.length).replace(/^\/+/, '');
  return key || null;
}
