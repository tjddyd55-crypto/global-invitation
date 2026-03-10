import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { buildPublicFileUrl, r2Client, resolveR2Config } from './r2Client';

export async function uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const config = resolveR2Config();
  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
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
