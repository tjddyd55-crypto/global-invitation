/**
 * Temporary invitation media retention — env validation.
 * Default 72h. Clamp invalid values; never allow immediate wipe.
 */

export const DEFAULT_TEMP_MEDIA_RETENTION_HOURS = 72;
export const MIN_TEMP_MEDIA_RETENTION_HOURS = 24;
export const MAX_TEMP_MEDIA_RETENTION_HOURS = 720;
export const DEFAULT_TEMP_MEDIA_CLEANUP_BATCH_SIZE = 100;
export const DEFAULT_TEMP_MEDIA_SAFETY_THRESHOLD = 1000;

export function resolveTempMediaRetentionHours(raw: unknown = process.env.INVITATION_TEMP_MEDIA_RETENTION_HOURS): number {
  const parsed = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim());
  if (!Number.isFinite(parsed) || parsed < MIN_TEMP_MEDIA_RETENTION_HOURS) {
    return DEFAULT_TEMP_MEDIA_RETENTION_HOURS;
  }
  if (parsed > MAX_TEMP_MEDIA_RETENTION_HOURS) {
    return MAX_TEMP_MEDIA_RETENTION_HOURS;
  }
  return Math.floor(parsed);
}

export function resolveTempMediaCleanupBatchSize(
  raw: unknown = process.env.INVITATION_TEMP_MEDIA_CLEANUP_BATCH_SIZE
): number {
  const parsed = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim());
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_TEMP_MEDIA_CLEANUP_BATCH_SIZE;
  return Math.min(500, Math.floor(parsed));
}

export function resolveTempMediaSafetyThreshold(
  raw: unknown = process.env.INVITATION_TEMP_MEDIA_SAFETY_THRESHOLD
): number {
  const parsed = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim());
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_TEMP_MEDIA_SAFETY_THRESHOLD;
  return Math.floor(parsed);
}

export function isTempMediaCleanupEnabled(
  raw: unknown = process.env.INVITATION_TEMP_MEDIA_CLEANUP_ENABLED
): boolean {
  const value = String(raw ?? 'false').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

export function retentionCutoffDate(now: Date = new Date(), hours = resolveTempMediaRetentionHours()): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}
