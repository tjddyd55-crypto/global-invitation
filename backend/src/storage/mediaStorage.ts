import crypto from 'crypto';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export const LOCAL_MEDIA_ROUTE_PREFIX = '/media';
const LOCAL_MEDIA_DIRECTORY = path.resolve(
  process.cwd(),
  process.env.MEDIA_LOCAL_DIRECTORY || 'storage/media'
);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type StorageProvider = 'local' | 's3';

export type UploadImageParams = {
  file: Express.Multer.File;
  publicBaseUrl: string;
};

export type UploadImageResult = {
  url: string;
};

function getStorageProvider(): StorageProvider {
  return process.env.MEDIA_STORAGE_PROVIDER === 's3' ? 's3' : 'local';
}

function ensureAllowedMimeType(mimeType: string) {
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new Error('UNSUPPORTED_MEDIA_TYPE');
  }
}

function buildSafeFileExtension(file: Express.Multer.File): string {
  const sourceExtension = path.extname(file.originalname || '').toLowerCase();
  if (sourceExtension === '.jpg' || sourceExtension === '.jpeg') return '.jpg';
  if (sourceExtension === '.png') return '.png';
  if (sourceExtension === '.webp') return '.webp';

  if (file.mimetype === 'image/jpeg') return '.jpg';
  if (file.mimetype === 'image/png') return '.png';
  return '.webp';
}

function buildObjectKey(file: Express.Multer.File): string {
  const dateSegment = new Date().toISOString().slice(0, 10);
  const prefix = (process.env.MEDIA_S3_PREFIX || 'media').replace(/^\/+|\/+$/g, '');
  const extension = buildSafeFileExtension(file);
  const uniqueName = `${dateSegment}/${crypto.randomUUID()}${extension}`;
  return `${prefix}/${uniqueName}`;
}

function buildLocalFileName(file: Express.Multer.File): string {
  return buildObjectKey(file).replace(/^media\//, '');
}

function resolveConfiguredPublicBaseUrl(publicBaseUrl: string): string {
  const configured =
    process.env.MEDIA_PUBLIC_BASE_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    '';
  return configured.trim() || publicBaseUrl;
}

function buildS3Client(): S3Client {
  const bucket = process.env.MEDIA_S3_BUCKET?.trim();
  const region = process.env.MEDIA_S3_REGION?.trim();
  const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY?.trim();

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error('MEDIA_STORAGE_NOT_CONFIGURED');
  }

  return new S3Client({
    region,
    endpoint: process.env.MEDIA_S3_ENDPOINT?.trim() || undefined,
    forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getRequiredBucket(): string {
  const bucket = process.env.MEDIA_S3_BUCKET?.trim();
  if (!bucket) {
    throw new Error('MEDIA_STORAGE_NOT_CONFIGURED');
  }
  return bucket;
}

function buildS3PublicUrl(key: string): string {
  const configuredBase = process.env.MEDIA_S3_PUBLIC_BASE_URL?.trim();
  if (configuredBase) {
    return new URL(key, configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`).toString();
  }

  const endpoint = process.env.MEDIA_S3_ENDPOINT?.trim();
  const bucket = getRequiredBucket();
  if (endpoint) {
    return new URL(`${bucket}/${key}`, endpoint.endsWith('/') ? endpoint : `${endpoint}/`).toString();
  }

  const region = process.env.MEDIA_S3_REGION?.trim();
  if (!region) {
    throw new Error('MEDIA_STORAGE_NOT_CONFIGURED');
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function resolveS3KeyFromUrl(url: string): string {
  const parsed = new URL(url);
  const pathname = parsed.pathname.replace(/^\/+/, '');
  const bucket = process.env.MEDIA_S3_BUCKET?.trim();

  if (bucket && pathname.startsWith(`${bucket}/`)) {
    return pathname.slice(bucket.length + 1);
  }

  return pathname;
}

async function uploadLocalImage({ file, publicBaseUrl }: UploadImageParams): Promise<UploadImageResult> {
  await fsp.mkdir(LOCAL_MEDIA_DIRECTORY, { recursive: true });
  const relativeFileName = buildLocalFileName(file);
  const targetPath = path.join(LOCAL_MEDIA_DIRECTORY, relativeFileName);
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  await fsp.writeFile(targetPath, file.buffer);

  const base = resolveConfiguredPublicBaseUrl(publicBaseUrl);
  const normalizedRoute = `${LOCAL_MEDIA_ROUTE_PREFIX}/${relativeFileName.replace(/\\/g, '/')}`;
  return {
    url: new URL(normalizedRoute, base.endsWith('/') ? base : `${base}/`).toString(),
  };
}

async function uploadS3Image({ file }: UploadImageParams): Promise<UploadImageResult> {
  const client = buildS3Client();
  const bucket = getRequiredBucket();
  const key = buildObjectKey(file);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return {
    url: buildS3PublicUrl(key),
  };
}

export async function uploadImage(params: UploadImageParams): Promise<UploadImageResult> {
  ensureAllowedMimeType(params.file.mimetype);

  if (getStorageProvider() === 's3') {
    return uploadS3Image(params);
  }

  return uploadLocalImage(params);
}

export async function deleteImage(url: string): Promise<void> {
  if (!url.trim()) return;

  if (getStorageProvider() === 's3') {
    const client = buildS3Client();
    const bucket = getRequiredBucket();
    const key = resolveS3KeyFromUrl(url);
    if (!key) return;
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return;
  }

  const parsed = new URL(url);
  const routePrefix = `${LOCAL_MEDIA_ROUTE_PREFIX}/`;
  const normalizedPathname = parsed.pathname.replace(/\\/g, '/');
  if (!normalizedPathname.startsWith(routePrefix)) {
    return;
  }

  const relativePath = normalizedPathname.slice(routePrefix.length);
  const targetPath = path.join(LOCAL_MEDIA_DIRECTORY, relativePath);

  try {
    await fsp.unlink(targetPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export function ensureLocalMediaStorageReady() {
  if (getStorageProvider() !== 'local') {
    return;
  }
  fs.mkdirSync(LOCAL_MEDIA_DIRECTORY, { recursive: true });
}

export function resolveLocalMediaDirectory() {
  return LOCAL_MEDIA_DIRECTORY;
}
