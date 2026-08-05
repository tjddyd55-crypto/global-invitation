/**
 * 신규 시각 템플릿 샘플 이미지 발행 (관리자/배포 전용, 1회성 도구).
 *
 * 원본 PNG → WebP 변환 → R2 shared 카탈로그 업로드.
 * 대상 키: invitation/shared/images/templates/{folder}/{file}.webp
 *
 * 사용법:
 *   railway run -s Backend -e development npx tsx scripts/publish-template-sample-assets.ts --source <dir>
 *   ... --dry-run  (변환만 하고 업로드하지 않음)
 *
 * 변환 결과는 <repo>/artifacts/template-sample-assets 에 남아 재검증할 수 있다.
 */
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { r2Client, resolveR2Config } from '../src/lib/storage/r2Client';

type Variant = 'hero' | 'thumbnail' | 'photo' | 'profile';

type AssetPlan = {
  /** --source 기준 상대 경로 */
  sourceFile: string;
  /** invitation/shared/images/templates/ 하위 경로 (확장자 제외) */
  target: string;
  variant: Variant;
};

const TEMPLATE_ASSET_PREFIX = 'invitation/shared/images/templates';

const VARIANT_TRANSFORMS: Record<Variant, { width: number; height?: number; quality: number }> = {
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

function buildPlans(): AssetPlan[] {
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

function parseArgs(): { sourceDir: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf('--source');
  if (sourceIndex === -1 || !args[sourceIndex + 1]) {
    throw new Error('USAGE: --source <dir> [--dry-run]');
  }
  return {
    sourceDir: path.resolve(args[sourceIndex + 1]),
    dryRun: args.includes('--dry-run'),
  };
}

async function transform(sourcePath: string, variant: Variant): Promise<Buffer> {
  const { width, height, quality } = VARIANT_TRANSFORMS[variant];
  const pipeline = sharp(sourcePath).rotate();
  const resized = height
    ? pipeline.resize(width, height, { fit: 'cover', position: 'attention' })
    : pipeline.resize({ width, withoutEnlargement: true });
  return resized.webp({ quality }).toBuffer();
}

async function main(): Promise<void> {
  const { sourceDir, dryRun } = parseArgs();
  const stageDir = path.resolve(__dirname, '../../artifacts/template-sample-assets');
  const plans = buildPlans();
  const config = dryRun ? null : resolveR2Config();

  let published = 0;
  for (const plan of plans) {
    const sourcePath = path.join(sourceDir, plan.sourceFile);
    const body = await transform(sourcePath, plan.variant);
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
    process.stdout.write(`${dryRun ? 'STAGED' : 'PUT'} ${objectKey} (${body.length} bytes)\n`);
  }

  process.stdout.write(
    `\n${dryRun ? 'dry-run' : 'uploaded'}: ${dryRun ? plans.length : published}/${plans.length}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
