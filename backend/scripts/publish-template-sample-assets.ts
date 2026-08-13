/**
 * 신규 시각 템플릿 샘플 이미지 발행 (관리자/배포 전용, 1회성 도구).
 *
 * 원본 PNG → WebP 변환 → R2 shared 카탈로그 업로드.
 * 대상 키: invitation/shared/images/templates/{folder}/{file}.webp
 *
 * 사용법:
 *   railway run -s Backend -e development npx tsx scripts/publish-template-sample-assets.ts --source <dir>
 *   ... --organization-logo <png-or-webp>   (ORGANIZATION_01_OFFICIAL/logo.webp 만)
 *   ... --organization-logo-dark <file>     (ORGANIZATION_01_OFFICIAL/logo-on-dark.webp)
 *   ... --jci-thumbnail <png-or-webp>       (ORGANIZATION_02_JCI/thumbnail.webp)
 *   ... --dry-run  (변환만 하고 업로드하지 않음)
 *
 * 변환 결과는 <repo>/artifacts/template-sample-assets 에 남아 재검증할 수 있다.
 */
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { r2Client, resolveR2Config } from '../src/lib/storage/r2Client';

type CatalogVariant = 'hero' | 'thumbnail' | 'photo' | 'profile';
type Variant = CatalogVariant | 'logo' | 'logoDark';

type AssetPlan = {
  /** --source 기준 상대 경로, 또는 organization logo 절대/상대 경로 */
  sourceFile: string;
  /** invitation/shared/images/templates/ 하위 경로 (확장자 제외) */
  target: string;
  variant: Variant;
  /** true 이면 sourceFile 을 cwd 기준 path.resolve 한다 (--organization-logo) */
  absoluteSource?: boolean;
  /** thumbnail cover crop 기준. JCI preview capture 는 상단(logo+hero) 유지. */
  coverPosition?: 'attention' | 'top';
};

const TEMPLATE_ASSET_PREFIX = 'invitation/shared/images/templates';
const ORGANIZATION_LOGO_TARGET = 'ORGANIZATION_01_OFFICIAL/logo';
const ORGANIZATION_LOGO_DARK_TARGET = 'ORGANIZATION_01_OFFICIAL/logo-on-dark';
const JCI_THUMBNAIL_TARGET = 'ORGANIZATION_02_JCI/thumbnail';
const LOGO_MAX_EDGE = 1600;

const VARIANT_TRANSFORMS: Record<
  CatalogVariant,
  { width: number; height?: number; quality: number }
> = {
  hero: { width: 1080, quality: 82 },
  thumbnail: { width: 720, height: 540, quality: 78 },
  photo: { width: 900, quality: 80 },
  profile: { width: 480, height: 480, quality: 82 },
};

const WEDDING_HEROES: Array<[templateId: string, source: string]> = [
  ['WEDDING_01_CLASSIC', 'wedding-hero-classic.png'],
  ['WEDDING_04_EDITORIAL', 'wedding-hero-editorial.png'],
  ['WEDDING_05_GARDEN', 'wedding-hero-garden.png'],
  ['WEDDING_06_NIGHT', 'wedding-hero-night.png'],
];

const GENERAL_HEROES: Array<[templateId: string, source: string]> = [
  ['GENERAL_01_CLASSIC', 'general-hero-classic.png'],
  ['GENERAL_04_CLEAN', 'general-hero-clean.png'],
  ['GENERAL_05_FESTIVE', 'general-hero-festive.png'],
  ['GENERAL_06_CULTURE', 'general-hero-culture.png'],
];

const SHARED_PHOTO_COUNT = 8;

function buildCatalogPlans(): AssetPlan[] {
  const plans: AssetPlan[] = [];

  for (const [templateId, sourceFile] of [...WEDDING_HEROES, ...GENERAL_HEROES]) {
    plans.push({ sourceFile, target: `${templateId}/hero`, variant: 'hero' });
    plans.push({ sourceFile, target: `${templateId}/thumbnail`, variant: 'thumbnail' });
  }

  for (let index = 1; index <= SHARED_PHOTO_COUNT; index += 1) {
    const n = String(index).padStart(2, '0');
    plans.push({
      sourceFile: `wedding-photo-${n}.png`,
      target: `shared-wedding/photo-${n}`,
      variant: 'photo',
    });
    plans.push({
      sourceFile: `general-photo-${n}.png`,
      target: `shared-general/photo-${n}`,
      variant: 'photo',
    });
  }

  plans.push({
    sourceFile: 'wedding-profile-groom.png',
    target: 'shared-wedding/groom',
    variant: 'profile',
  });
  plans.push({
    sourceFile: 'wedding-profile-bride.png',
    target: 'shared-wedding/bride',
    variant: 'profile',
  });

  return plans;
}

function parseArgs(): {
  sourceDir: string | null;
  organizationLogo: string | null;
  organizationLogoDark: string | null;
  jciThumbnail: string | null;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf('--source');
  const logoIndex = args.indexOf('--organization-logo');
  const logoDarkIndex = args.indexOf('--organization-logo-dark');
  const jciThumbIndex = args.indexOf('--jci-thumbnail');
  const sourceDir =
    sourceIndex !== -1 && args[sourceIndex + 1] ? path.resolve(args[sourceIndex + 1]) : null;
  const organizationLogo =
    logoIndex !== -1 && args[logoIndex + 1] ? path.resolve(args[logoIndex + 1]) : null;
  const organizationLogoDark =
    logoDarkIndex !== -1 && args[logoDarkIndex + 1] ? path.resolve(args[logoDarkIndex + 1]) : null;
  const jciThumbnail =
    jciThumbIndex !== -1 && args[jciThumbIndex + 1] ? path.resolve(args[jciThumbIndex + 1]) : null;

  if (!sourceDir && !organizationLogo && !organizationLogoDark && !jciThumbnail) {
    throw new Error(
      'USAGE: --source <dir> and/or --organization-logo <file> and/or --organization-logo-dark <file> and/or --jci-thumbnail <file> [--dry-run]'
    );
  }

  return {
    sourceDir,
    organizationLogo,
    organizationLogoDark,
    jciThumbnail,
    dryRun: args.includes('--dry-run'),
  };
}

async function transformCatalog(
  sourcePath: string,
  variant: CatalogVariant,
  coverPosition: 'attention' | 'top' = 'attention'
): Promise<Buffer> {
  const { width, height, quality } = VARIANT_TRANSFORMS[variant];
  const pipeline = sharp(sourcePath).rotate();
  const resized = height
    ? pipeline.resize(width, height, { fit: 'cover', position: coverPosition })
    : pipeline.resize({ width, withoutEnlargement: true });
  return resized.webp({ quality }).toBuffer();
}

/**
 * 브랜드 로고 — trim(투명 여백) → max 1600 inside → alpha 유지 WebP.
 * crop / 색상 변경 / upscale 없음.
 */
async function transformLogo(sourcePath: string): Promise<Buffer> {
  const trimmed = await sharp(sourcePath).rotate().trim({ threshold: 10 }).toBuffer();
  return sharp(trimmed)
    .resize({
      width: LOGO_MAX_EDGE,
      height: LOGO_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 92, alphaQuality: 100, effort: 4 })
    .toBuffer();
}

const JCI_BLACK = { r: 19, g: 15, b: 45 };
const LOGO_DARK_KEY_THRESHOLD = 72;
const LOGO_DARK_BRIGHT_LUMINANCE = 56;
const LOGO_DARK_WHITE_MIN = 220;

function chromaKeyNearJciBlack(pixels: Buffer, channels: number): void {
  for (let index = 0; index < pixels.length; index += channels) {
    const dist =
      Math.abs(pixels[index] - JCI_BLACK.r) +
      Math.abs(pixels[index + 1] - JCI_BLACK.g) +
      Math.abs(pixels[index + 2] - JCI_BLACK.b);
    if (dist <= LOGO_DARK_KEY_THRESHOLD) pixels[index + 3] = 0;
  }
}

function isNearWhitePixel(pixels: Buffer, index: number): boolean {
  return (
    pixels[index] >= LOGO_DARK_WHITE_MIN &&
    pixels[index + 1] >= LOGO_DARK_WHITE_MIN &&
    pixels[index + 2] >= LOGO_DARK_WHITE_MIN
  );
}

/** Clear white canvas from the border only — does not reach centered white glyphs. */
function floodClearBorderWhite(pixels: Buffer, width: number, height: number): void {
  const seen = new Uint8Array(width * height);
  const queue: number[] = [];
  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const id = y * width + x;
    if (seen[id]) return;
    seen[id] = 1;
    queue.push(id);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const id = queue.pop() as number;
    const index = id * 4;
    if (pixels[index + 3] === 0) continue;
    const maxC = Math.max(pixels[index], pixels[index + 1], pixels[index + 2]);
    const minC = Math.min(pixels[index], pixels[index + 1], pixels[index + 2]);
    const lowSaturationGray = maxC - minC < 40;
    if (!isNearWhitePixel(pixels, index) && !lowSaturationGray) continue;
    pixels[index + 3] = 0;
    const x = id % width;
    const y = Math.floor(id / width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }
}

function brightContentRegion(
  data: Buffer,
  width: number,
  height: number
): { left: number; top: number; width: number; height: number } {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 32) continue;
      const luminance = (data[index] + data[index + 1] + data[index + 2]) / 3;
      if (luminance < LOGO_DARK_BRIGHT_LUMINANCE) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) {
    throw new Error('logo-dark: no bright logo content after chroma-key');
  }
  const padX = Math.max(2, Math.round((maxX - minX + 1) * 0.08));
  const padY = Math.max(2, Math.round((maxY - minY + 1) * 0.08));
  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padY);
  return {
    left,
    top,
    width: Math.min(width - left, maxX - minX + 1 + padX * 2),
    height: Math.min(height - top, maxY - minY + 1 + padY * 2),
  };
}

/**
 * Dark-surface inverted logo.
 * Trim white canvas → chroma-key JCI Black → crop bright glyphs → WebP.
 * Does not recolor logo pixels.
 */
async function transformLogoDark(sourcePath: string): Promise<Buffer> {
  const trimmed = await sharp(sourcePath).rotate().ensureAlpha().trim({ threshold: 24 }).toBuffer();
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);
  chromaKeyNearJciBlack(pixels, info.channels);
  floodClearBorderWhite(pixels, info.width, info.height);

  const keyedPng = await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();

  const keyed = await sharp(keyedPng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const region = brightContentRegion(keyed.data, keyed.info.width, keyed.info.height);

  return sharp(keyedPng)
    .extract(region)
    .resize({
      width: LOGO_MAX_EDGE,
      height: LOGO_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 92, alphaQuality: 100, effort: 4 })
    .toBuffer();
}

async function transform(
  sourcePath: string,
  variant: Variant,
  coverPosition: 'attention' | 'top' = 'attention'
): Promise<Buffer> {
  if (variant === 'logo') return transformLogo(sourcePath);
  if (variant === 'logoDark') return transformLogoDark(sourcePath);
  return transformCatalog(sourcePath, variant, coverPosition);
}

function buildPlans(args: {
  sourceDir: string | null;
  organizationLogo: string | null;
  organizationLogoDark: string | null;
  jciThumbnail: string | null;
}): AssetPlan[] {
  const plans: AssetPlan[] = [];
  if (args.sourceDir) {
    plans.push(...buildCatalogPlans());
  }
  if (args.organizationLogo) {
    plans.push({
      sourceFile: args.organizationLogo,
      target: ORGANIZATION_LOGO_TARGET,
      variant: 'logo',
      absoluteSource: true,
    });
  }
  if (args.organizationLogoDark) {
    plans.push({
      sourceFile: args.organizationLogoDark,
      target: ORGANIZATION_LOGO_DARK_TARGET,
      variant: 'logoDark',
      absoluteSource: true,
    });
  }
  if (args.jciThumbnail) {
    plans.push({
      sourceFile: args.jciThumbnail,
      target: JCI_THUMBNAIL_TARGET,
      variant: 'thumbnail',
      absoluteSource: true,
      coverPosition: 'top',
    });
  }
  return plans;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const stageDir = path.resolve(__dirname, '../../artifacts/template-sample-assets');
  const plans = buildPlans(args);
  const config = args.dryRun ? null : resolveR2Config();

  let published = 0;
  for (const plan of plans) {
    const sourcePath = plan.absoluteSource
      ? plan.sourceFile
      : path.join(args.sourceDir as string, plan.sourceFile);
    const body = await transform(sourcePath, plan.variant, plan.coverPosition);
    const objectKey = `${TEMPLATE_ASSET_PREFIX}/${plan.target}.webp`;

    const stagePath = path.join(stageDir, `${plan.target}.webp`);
    await fs.mkdir(path.dirname(stagePath), { recursive: true });
    await fs.writeFile(stagePath, body);

    if (config) {
      await r2Client.send(
        new PutObjectCommand({
          Bucket: config.bucketName,
          Key: objectKey,
          Body: body,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      published += 1;
    }
    process.stdout.write(`${args.dryRun ? 'STAGED' : 'PUT'} ${objectKey} (${body.length} bytes)\n`);
  }

  process.stdout.write(
    `\n${args.dryRun ? 'dry-run' : 'uploaded'}: ${args.dryRun ? plans.length : published}/${plans.length}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
