/**
 * One-shot R2 template asset audit (development).
 * Usage: railway run -s Backend -e development npx tsx scripts/audit-template-sample-assets.ts
 */
import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client, resolveR2Config } from '../src/lib/storage/r2Client';

const PREFIX = 'invitation/shared/images/templates/';

const EXPECTED = [
  'WEDDING_01_CLASSIC/hero.webp',
  'WEDDING_01_CLASSIC/thumbnail.webp',
  'WEDDING_04_EDITORIAL/hero.webp',
  'WEDDING_04_EDITORIAL/thumbnail.webp',
  'WEDDING_05_GARDEN/hero.webp',
  'WEDDING_05_GARDEN/thumbnail.webp',
  'WEDDING_06_NIGHT/hero.webp',
  'WEDDING_06_NIGHT/thumbnail.webp',
  'GENERAL_01_CLASSIC/hero.webp',
  'GENERAL_01_CLASSIC/thumbnail.webp',
  'GENERAL_04_CLEAN/hero.webp',
  'GENERAL_04_CLEAN/thumbnail.webp',
  'GENERAL_05_FESTIVE/hero.webp',
  'GENERAL_05_FESTIVE/thumbnail.webp',
  'GENERAL_06_CULTURE/hero.webp',
  'GENERAL_06_CULTURE/thumbnail.webp',
  'shared-wedding/photo-01.webp',
  'shared-wedding/photo-02.webp',
  'shared-wedding/photo-03.webp',
  'shared-wedding/photo-04.webp',
  'shared-wedding/photo-05.webp',
  'shared-wedding/photo-06.webp',
  'shared-wedding/photo-07.webp',
  'shared-wedding/photo-08.webp',
  'shared-wedding/groom.webp',
  'shared-wedding/bride.webp',
  'shared-general/photo-01.webp',
  'shared-general/photo-02.webp',
  'shared-general/photo-03.webp',
  'shared-general/photo-04.webp',
  'shared-general/photo-05.webp',
  'shared-general/photo-06.webp',
  'shared-general/photo-07.webp',
  'shared-general/photo-08.webp',
] as const;

async function listAll(): Promise<Array<{ key: string; size: number }>> {
  const config = resolveR2Config();
  const keys: Array<{ key: string; size: number }> = [];
  let token: string | undefined;
  do {
    const out = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: PREFIX,
        ContinuationToken: token,
      })
    );
    for (const obj of out.Contents || []) {
      if (obj.Key) keys.push({ key: obj.Key, size: obj.Size ?? 0 });
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function headOne(key: string): Promise<{ status: number; contentType: string; size: number }> {
  const config = resolveR2Config();
  try {
    const out = await r2Client.send(
      new HeadObjectCommand({ Bucket: config.bucketName, Key: key })
    );
    return {
      status: 200,
      contentType: out.ContentType || '',
      size: out.ContentLength ?? 0,
    };
  } catch (error) {
    return { status: 0, contentType: String(error), size: 0 };
  }
}

async function decodeWebp(key: string): Promise<boolean> {
  const config = resolveR2Config();
  const out = await r2Client.send(
    new GetObjectCommand({ Bucket: config.bucketName, Key: key })
  );
  const bytes = await out.Body?.transformToByteArray();
  if (!bytes || bytes.length < 12) return false;
  // RIFF....WEBP
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

async function httpProbe(url: string): Promise<{ status: number; contentType: string; size: number }> {
  const res = await fetch(url, { method: 'GET' });
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    size: buf.length,
  };
}

async function main(): Promise<void> {
  const config = resolveR2Config();
  const listed = await listAll();
  const listedRel = listed.map((item) => item.key.replace(PREFIX, ''));
  const expectedSet = new Set(EXPECTED);
  const listedSet = new Set(listedRel);
  const missing = EXPECTED.filter((rel) => !listedSet.has(rel));
  const orphan = listedRel.filter((rel) => !expectedSet.has(rel as (typeof EXPECTED)[number]));

  const heads: Array<Record<string, unknown>> = [];
  let httpOk = 0;
  let mimeOk = 0;
  let decodeOk = 0;
  let tiny = 0;
  let zero = 0;

  for (const rel of EXPECTED) {
    const key = `${PREFIX}${rel}`;
    const head = await headOne(key);
    const url = `${config.publicUrl}/${key}`;
    const http = await httpProbe(url);
    const decoded = http.status === 200 ? await decodeWebp(key) : false;
    if (http.status === 200) httpOk += 1;
    if (http.contentType.includes('image/webp')) mimeOk += 1;
    if (decoded) decodeOk += 1;
    if (http.size === 0) zero += 1;
    if (http.size > 0 && http.size < 1500) tiny += 1;
    heads.push({
      rel,
      headStatus: head.status,
      httpStatus: http.status,
      contentType: http.contentType,
      size: http.size,
      decoded,
    });
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        publicUrl: config.publicUrl,
        expected: EXPECTED.length,
        listed: listed.length,
        missing,
        orphan,
        httpOk,
        mimeOk,
        decodeOk,
        zeroByte: zero,
        tinyUnder1500: tiny,
        sample: heads.slice(0, 3),
        all: heads,
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
