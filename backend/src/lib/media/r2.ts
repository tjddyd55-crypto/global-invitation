import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const DEFAULT_UPLOAD_EXPIRES_SECONDS = 3600;
const MIN_UPLOAD_EXPIRES_SECONDS = 600;
const MAX_UPLOAD_EXPIRES_SECONDS = 3600;

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
  region: string;
  endpoint: string;
};

export type HeadObjectResult = {
  exists: boolean;
  contentLength: number | null;
  contentType: string | null;
  eTag: string | null;
  lastModified: Date | null;
};

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function isPlaceholder(value: string): boolean {
  const normalized = value.trim();
  return normalized.startsWith('<') && normalized.endsWith('>');
}

function normalizePublicBaseUrl(): string {
  const fromPreferred = process.env.R2_PUBLIC_BASE_URL?.trim() || '';
  const fromLegacy = process.env.R2_PUBLIC_URL?.trim() || '';
  const resolved = fromPreferred || fromLegacy;
  return normalizeBaseUrl(resolved);
}

export function resolveR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim() || '';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || '';
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || '';
  const bucketName = process.env.R2_BUCKET_NAME?.trim() || '';
  const publicBaseUrl = normalizePublicBaseUrl();
  const region = process.env.R2_REGION?.trim() || 'auto';
  const endpoint =
    process.env.R2_ENDPOINT?.trim() || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');

  if (
    !accountId ||
    !bucketName ||
    !publicBaseUrl ||
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey ||
    isPlaceholder(accessKeyId) ||
    isPlaceholder(secretAccessKey)
  ) {
    throw new Error('R2_STORAGE_NOT_CONFIGURED');
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl,
    region,
    endpoint,
  };
}

let cachedClient: S3Client | null = null;
let cachedClientKey = '';

export function getR2Client(): S3Client {
  const config = resolveR2Config();
  const nextKey = `${config.endpoint}|${config.region}|${config.accessKeyId}`;
  if (cachedClient && cachedClientKey === nextKey) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  cachedClientKey = nextKey;
  return cachedClient;
}

function clampPresignExpiry(expiresInSeconds?: number): number {
  const parsed = Number(expiresInSeconds || DEFAULT_UPLOAD_EXPIRES_SECONDS);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_UPLOAD_EXPIRES_SECONDS;
  }
  return Math.min(MAX_UPLOAD_EXPIRES_SECONDS, Math.max(MIN_UPLOAD_EXPIRES_SECONDS, Math.trunc(parsed)));
}

function resolveVersionToken(objectKey: string): string {
  const segments = objectKey.replace(/^\/+/, '').split('/').filter(Boolean);
  const fileName = segments[segments.length - 1] || '';
  const matched = fileName.match(/^(\d{10,})-[a-z0-9]+/i);
  if (matched?.[1]) {
    return matched[1];
  }
  return String(segments.join('').length || 1);
}

export function buildPublicMediaUrl(objectKey: string): string {
  const config = resolveR2Config();
  const normalizedKey = objectKey.replace(/^\/+/, '');
  const version = resolveVersionToken(normalizedKey);
  return `${config.publicBaseUrl}/${normalizedKey}?v=${version}`;
}

export async function createPresignedUploadUrl(params: {
  objectKey: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; expiresIn: number }> {
  const config = resolveR2Config();
  const client = getR2Client();
  const expiresIn = clampPresignExpiry(params.expiresInSeconds);
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: params.objectKey,
    ContentType: params.contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  return { uploadUrl, expiresIn };
}

export async function headObject(objectKey: string): Promise<HeadObjectResult> {
  const config = resolveR2Config();
  const client = getR2Client();

  try {
    const response = await client.send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
      })
    );
    return {
      exists: true,
      contentLength: typeof response.ContentLength === 'number' ? response.ContentLength : null,
      contentType: response.ContentType || null,
      eTag: response.ETag || null,
      lastModified: response.LastModified || null,
    };
  } catch (error) {
    const maybeError = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (
      maybeError?.name === 'NotFound' ||
      maybeError?.name === 'NoSuchKey' ||
      maybeError?.$metadata?.httpStatusCode === 404
    ) {
      return {
        exists: false,
        contentLength: null,
        contentType: null,
        eTag: null,
        lastModified: null,
      };
    }
    throw error;
  }
}

export async function deleteObject(objectKey: string): Promise<void> {
  const config = resolveR2Config();
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    })
  );
}
