/**
 * 초대장 로컬 저장 (localStorage). Backend API 호출 없음.
 * Stub 단계: 생성 → 미리보기 → 공개 사이클 전부 로컬에서 처리.
 */

import type { Invitation } from '@/src/models/invitation';
import type { InvitationRuntimeData, StoredInvitationRuntimeData } from '@/src/invitation/schemas';
import { isInvitationRuntimeData } from '@/src/invitation/schemas';

const STORAGE_PREFIX = 'invitation_draft_';

export function generateDraftSlug(): string {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = createDraftSlugCandidate();
    if (!isDraftSlugTaken(candidate)) {
      return candidate;
    }
  }
  throw new Error('Failed to generate unique draft slug after 5 attempts.');
}

export type StoredRuntimeData = StoredInvitationRuntimeData;

export type StoredDraft = {
  invitation: Invitation;
  runtimeData: StoredRuntimeData;
  savedAt: string;
  status: 'draft' | 'published';
};

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

function createDraftSlugCandidate(): string {
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoApi?.randomUUID) {
    return `draft-${cryptoApi.randomUUID()}`;
  }
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `draft-${Date.now()}-${randomPart}`;
}

function isDraftSlugTaken(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(storageKey(slug)) !== null;
  } catch {
    return false;
  }
}

function removeDraft(slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(storageKey(slug));
  } catch {
    // ignore
  }
}

function serializeRuntimeData(runtimeData: InvitationRuntimeData): StoredRuntimeData {
  if (!runtimeData || typeof runtimeData !== 'object') {
    return runtimeData as StoredRuntimeData;
  }

  const candidate = runtimeData as { weddingDate?: unknown };
  if (candidate.weddingDate instanceof Date) {
    return {
      ...candidate,
      weddingDate: candidate.weddingDate.toISOString(),
    } as StoredRuntimeData;
  }

  return runtimeData as StoredRuntimeData;
}

function deserializeRuntimeData(runtimeData: StoredRuntimeData): InvitationRuntimeData | null {
  if (!runtimeData || typeof runtimeData !== 'object') {
    return isInvitationRuntimeData(runtimeData) ? runtimeData : null;
  }

  const candidate = runtimeData as { weddingDate?: unknown };
  const normalized =
    typeof candidate.weddingDate === 'string'
      ? (() => {
          const weddingDate = new Date(candidate.weddingDate);
          if (Number.isNaN(weddingDate.getTime())) {
            return null;
          }

          return {
            ...candidate,
            weddingDate,
          };
        })()
      : runtimeData;

  if (normalized === null) {
    return null;
  }

  return isInvitationRuntimeData(normalized) ? normalized : null;
}

export function saveInvitationDraft(
  slug: string,
  invitation: Invitation,
  runtimeData: InvitationRuntimeData,
  status: 'draft' | 'published' = 'draft'
): boolean {
  if (typeof window === 'undefined') return false;
  const normalizedInvitation: Invitation = {
    ...invitation,
    status,
  };
  const stored: StoredDraft = {
    invitation: normalizedInvitation,
    runtimeData: serializeRuntimeData(runtimeData),
    savedAt: new Date().toISOString(),
    status,
  };
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

export function getInvitationDraft(slug: string): StoredDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed?.invitation?.slug || !parsed?.runtimeData) {
      removeDraft(slug);
      return null;
    }
    const normalizedStatus =
      parsed.status === 'published' || parsed.invitation.status === 'published' ? 'published' : 'draft';
    return {
      invitation: {
        ...parsed.invitation,
        status: normalizedStatus,
      },
      runtimeData: parsed.runtimeData as StoredRuntimeData,
      savedAt: parsed.savedAt || new Date().toISOString(),
      status: normalizedStatus,
    };
  } catch {
    removeDraft(slug);
    return null;
  }
}

export function getRuntimeDataFromDraft(slug: string): InvitationRuntimeData | null {
  const draft = getInvitationDraft(slug);
  if (!draft) return null;
  try {
    const runtimeData = deserializeRuntimeData(draft.runtimeData);
    if (runtimeData === null) {
      removeDraft(slug);
      return null;
    }

    return runtimeData;
  } catch {
    removeDraft(slug);
    return null;
  }
}

/** draft slug 목록 (이어서 편집 등용). 최근 순 일부만 반환 */
export function listDraftSlugs(limit: number = 20): string[] {
  if (typeof window === 'undefined') return [];
  const keys: string[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const slug = key.slice(STORAGE_PREFIX.length);
        if (slug) keys.push(slug);
      }
    }
  } catch {
    return [];
  }
  return keys.slice(0, limit);
}

export type DraftSummary = {
  slug: string;
  title: string;
  status: 'draft' | 'published';
  savedAt: string;
};

export function listDraftSummaries(limit: number = 100): DraftSummary[] {
  if (typeof window === 'undefined') return [];
  const summaries: DraftSummary[] = [];
  const slugs = listDraftSlugs(limit);
  for (const slug of slugs) {
    const draft = getInvitationDraft(slug);
    if (!draft) continue;
    summaries.push({
      slug,
      title: draft.invitation.title || 'Untitled Invitation',
      status: draft.status,
      savedAt: draft.savedAt,
    });
  }
  return summaries.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1)).slice(0, limit);
}
