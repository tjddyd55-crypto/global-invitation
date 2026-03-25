import sharp from 'sharp';

const SHARP_LIMIT_INPUT_PIXELS = 60_000_000;
const SMALL_MAX_EDGE = 480;
const MEDIUM_MAX_EDGE = 1200;
const WEBP_QUALITY = 82;
const JPEG_QUALITY = 85;

export type InvitationVariantUpload = {
  key: string;
  buffer: Buffer;
  contentType: string;
};

export type InvitationOptimizedVariantPlan = {
  uploads: InvitationVariantUpload[];
  primaryObjectKey: string;
  primaryFileSize: number;
  width: number | null;
  height: number | null;
};

function normalizeBasePrefix(basePrefix: string): string {
  return basePrefix.trim().replace(/\/+$/, '').replace(/^\/+/, '');
}

/**
 * 클라이언트가 올린 original.jpg 를 기준으로 small/medium + webp 동기 생성.
 * original.jpg 는 이미 R2에 있으므로 업로드 목록에는 포함하지 않는다.
 */
export async function prepareInvitationOptimizedUploads(
  originalJpeg: Buffer,
  basePrefix: string
): Promise<InvitationOptimizedVariantPlan> {
  const prefix = normalizeBasePrefix(basePrefix);
  if (!prefix) {
    throw new Error('INVALID_IMAGE_PREFIX');
  }

  const base = sharp(originalJpeg, { limitInputPixels: SHARP_LIMIT_INPUT_PIXELS }).rotate();

  const originalWebp = await base
    .clone()
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  const smallP = base.clone().resize({
    width: SMALL_MAX_EDGE,
    height: SMALL_MAX_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const smallJpeg = await smallP
    .clone()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toBuffer();
  const smallWebp = await smallP
    .clone()
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  const mediumP = base.clone().resize({
    width: MEDIUM_MAX_EDGE,
    height: MEDIUM_MAX_EDGE,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const mediumJpeg = await mediumP
    .clone()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toBuffer();
  const mediumWebp = await mediumP
    .clone()
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();

  const meta = await sharp(mediumWebp).metadata();
  const width = typeof meta.width === 'number' ? meta.width : null;
  const height = typeof meta.height === 'number' ? meta.height : null;

  const primaryObjectKey = `${prefix}/medium.webp`;

  const uploads: InvitationVariantUpload[] = [
    { key: `${prefix}/original.webp`, buffer: originalWebp, contentType: 'image/webp' },
    { key: `${prefix}/small.jpg`, buffer: smallJpeg, contentType: 'image/jpeg' },
    { key: `${prefix}/small.webp`, buffer: smallWebp, contentType: 'image/webp' },
    { key: `${prefix}/medium.jpg`, buffer: mediumJpeg, contentType: 'image/jpeg' },
    { key: `${prefix}/medium.webp`, buffer: mediumWebp, contentType: 'image/webp' },
  ];

  return {
    uploads,
    primaryObjectKey,
    primaryFileSize: mediumWebp.byteLength,
    width,
    height,
  };
}
