import sharp from 'sharp';
import { buildMediaObjectKey } from './keys';
import { buildCanonicalPublicUrl } from '../mediaKeyBuilder';
import { resolveKeyFromPublicUrl } from '../storage/r2Client';
import { readFileBuffer, uploadFile } from '../storage/uploadToR2';

export type CopyCanonicalPreviewInput = {
  sourceUrl?: string | null;
  sourceObjectKey?: string | null;
};

function normalizeSourceStorageKey(input: CopyCanonicalPreviewInput): string {
  const fromKey = input.sourceObjectKey?.trim().replace(/^\/+/, '') || '';
  if (fromKey) {
    return fromKey;
  }
  const url = input.sourceUrl?.trim().split('?')[0] || '';
  if (!url) {
    return '';
  }
  return resolveKeyFromPublicUrl(url) || '';
}

/**
 * 승인된 템플릿 submission 프리뷰를 `template/{templateId}/thumbnail/main.jpg` 로 복사한다.
 * `sourceObjectKey` 가 있으면 URL 파싱 없이 R2 에서 읽는다.
 */
export async function copySubmissionPreviewToCanonicalTemplateThumbnail(
  templateId: string,
  params: string | CopyCanonicalPreviewInput | null | undefined
): Promise<{ url: string; objectKey: string } | null> {
  const input: CopyCanonicalPreviewInput =
    typeof params === 'string' ? { sourceUrl: params } : params || {};

  const sourceKey = normalizeSourceStorageKey(input);
  if (!sourceKey) {
    return null;
  }

  const destKey = buildMediaObjectKey({
    scope: 'templateCover',
    templateId,
    contentType: 'image/jpeg',
  });

  try {
    const buf = await readFileBuffer(sourceKey);
    const jpeg = await sharp(buf, { failOn: 'none' }).rotate().jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    await uploadFile(jpeg, destKey, 'image/jpeg');
    const url = buildCanonicalPublicUrl(destKey);
    console.log('[R2_UPLOAD]', { key: destKey, url });
    return { url, objectKey: destKey };
  } catch (error) {
    console.warn('[copyCanonicalTemplateThumbnail] skipped:', error);
    return null;
  }
}
