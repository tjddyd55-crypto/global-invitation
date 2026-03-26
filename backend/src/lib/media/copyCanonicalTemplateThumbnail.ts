import sharp from 'sharp';
import { buildMediaObjectKey } from '../media/keys';
import { buildCanonicalPublicUrl } from '../mediaKeyBuilder';
import { resolveKeyFromPublicUrl } from '../storage/r2Client';
import { readFileBuffer, uploadFile } from '../storage/uploadToR2';

/**
 * 승인된 템플릿 submission 프리뷰를 `template/{templateId}/thumbnail/main.jpg` 로 복사한다.
 */
export async function copySubmissionPreviewToCanonicalTemplateThumbnail(
  templateId: string,
  sourceUrl: string | null | undefined
): Promise<string | null> {
  const normalized = sourceUrl?.trim();
  if (!normalized) {
    return null;
  }
  const sourceKey = resolveKeyFromPublicUrl(normalized.split('?')[0]);
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
    return url;
  } catch (error) {
    console.warn('[copyCanonicalTemplateThumbnail] skipped:', error);
    return null;
  }
}
