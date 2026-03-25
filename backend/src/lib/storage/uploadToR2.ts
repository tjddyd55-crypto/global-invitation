import { Readable } from 'stream';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { buildPublicFileUrl, r2Client, resolveR2Config } from './r2Client';

const CACHE_CONTROL_HEADER = 'public, max-age=31536000, immutable';
const DEFAULT_PRESIGNED_EXPIRES_SECONDS = 900;
const DELETE_BATCH_SIZE = 1000;

export async function uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const config = resolveR2Config();
  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: CACHE_CONTROL_HEADER,
    })
  );
  return buildPublicFileUrl(key);
}

export async function deleteFile(key: string): Promise<void> {
  const config = resolveR2Config();
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
  );
}

export async function createPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const config = resolveR2Config();
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: params.key,
    ContentType: params.contentType,
    CacheControl: CACHE_CONTROL_HEADER,
  });
  return getSignedUrl(r2Client, command, {
    expiresIn: params.expiresInSeconds ?? DEFAULT_PRESIGNED_EXPIRES_SECONDS,
  });
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) {
    throw new Error('R2_OBJECT_BODY_EMPTY');
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof Readable) {
    return streamToBuffer(body);
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (typeof body === 'object' && body !== null) {
    const maybeTransform = body as { transformToByteArray?: () => Promise<Uint8Array> };
    if (typeof maybeTransform.transformToByteArray === 'function') {
      const bytes = await maybeTransform.transformToByteArray();
      return Buffer.from(bytes);
    }
  }

  throw new Error('R2_OBJECT_BODY_UNSUPPORTED');
}

export async function readFileBuffer(key: string): Promise<Buffer> {
  const config = resolveR2Config();
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
  );
  return bodyToBuffer(response.Body);
}

export async function deleteFilesByPrefix(prefix: string): Promise<number> {
  const config = resolveR2Config();
  let continuationToken: string | undefined;
  let deletedCount = 0;

  do {
    const listed = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    const keys = (listed.Contents || [])
      .map((item) => item.Key)
      .filter((key): key is string => Boolean(key));

    for (let index = 0; index < keys.length; index += DELETE_BATCH_SIZE) {
      const batch = keys.slice(index, index + DELETE_BATCH_SIZE);
      if (batch.length === 0) continue;

      const result = await r2Client.send(
        new DeleteObjectsCommand({
          Bucket: config.bucketName,
          Delete: {
            Objects: batch.map((key) => ({ Key: key })),
            Quiet: true,
          },
        })
      );
      deletedCount += result.Deleted?.length || 0;
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  return deletedCount;
}

/** Prefix 아래의 모든 객체 키를 페이지 단위로 수집 (삭제 대기 큐 적재용) */
export async function listAllObjectKeysUnderPrefix(prefix: string): Promise<string[]> {
  const config = resolveR2Config();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const listed = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    for (const item of listed.Contents || []) {
      if (item.Key) {
        keys.push(item.Key);
      }
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

export async function deleteStaleObjectsUnderPrefix(params: {
  prefix: string;
  olderThan: Date;
  onEachDelete?: (key: string) => void;
}): Promise<number> {
  const config = resolveR2Config();
  let continuationToken: string | undefined;
  let deletedCount = 0;

  do {
    const listed = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: params.prefix,
        ContinuationToken: continuationToken,
      })
    );

    const staleKeys = (listed.Contents || [])
      .filter((item) => item.Key && item.LastModified && item.LastModified < params.olderThan)
      .map((item) => item.Key as string);

    for (let index = 0; index < staleKeys.length; index += DELETE_BATCH_SIZE) {
      const batch = staleKeys.slice(index, index + DELETE_BATCH_SIZE);
      if (batch.length === 0) continue;

      const result = await r2Client.send(
        new DeleteObjectsCommand({
          Bucket: config.bucketName,
          Delete: {
            Objects: batch.map((key) => ({ Key: key })),
            Quiet: true,
          },
        })
      );
      deletedCount += result.Deleted?.length || 0;
      batch.forEach((key) => params.onEachDelete?.(key));
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  return deletedCount;
}
