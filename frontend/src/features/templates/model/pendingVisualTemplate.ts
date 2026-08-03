const STORAGE_KEY = 'gi_pending_visual_template_v1';

export type PendingVisualTemplate = {
  conceptType: 'WEDDING' | 'GENERAL';
  visualTemplateId: string;
  createdAt: number;
};

export function savePendingVisualTemplate(value: PendingVisualTemplate): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function readPendingVisualTemplate(): PendingVisualTemplate | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingVisualTemplate;
    if (
      (parsed.conceptType !== 'WEDDING' && parsed.conceptType !== 'GENERAL') ||
      typeof parsed.visualTemplateId !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingVisualTemplate(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const VISUAL_TEMPLATE_RESUME_PATH = '/create/templates/resume';
