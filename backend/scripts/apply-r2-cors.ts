/**
 * Apply CORS on Cloudflare R2 bucket (S3-compatible PutBucketCors).
 * Usage (from repo root, with Backend env):
 *   cd backend && railway run -s Backend -e development -- npx tsx scripts/apply-r2-cors.ts
 *
 * Does not print secrets.
 */

import {
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  S3Client,
} from '@aws-sdk/client-s3';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim() || '';
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

async function main() {
  const accountId = requireEnv('R2_ACCOUNT_ID');
  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
  const bucketName = requireEnv('R2_BUCKET_NAME');
  const endpoint =
    process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`;
  const region = process.env.R2_REGION?.trim() || 'auto';

  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  const corsRules = [
    {
      AllowedOrigins: [
        'https://frontend-development-1b8a.up.railway.app',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ],
      AllowedMethods: ['GET', 'PUT', 'HEAD'],
      AllowedHeaders: ['Content-Type', 'Content-Length', 'x-amz-*'],
      ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
      MaxAgeSeconds: 3600,
    },
  ];

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: { CORSRules: corsRules },
    })
  );

  const current = await client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
  console.log('[r2-cors] applied', {
    bucket: bucketName,
    rules: current.CORSRules?.map((rule) => ({
      AllowedOrigins: rule.AllowedOrigins,
      AllowedMethods: rule.AllowedMethods,
      AllowedHeaders: rule.AllowedHeaders,
      ExposeHeaders: rule.ExposeHeaders,
      MaxAgeSeconds: rule.MaxAgeSeconds,
    })),
  });
}

main().catch((error) => {
  console.error('[r2-cors] failed', error instanceof Error ? error.message : error);
  process.exit(1);
});
