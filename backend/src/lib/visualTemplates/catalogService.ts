import {
  VisualTemplateCatalogStatus,
  VisualTemplateSourceType,
  VisualTemplateVersionStatus,
} from '@prisma/client';
import prisma from '../prisma';
import {
  CODE_VISUAL_TEMPLATE_SEEDS,
  isCodeRegistryKey,
  listCodeRegistryKeys,
} from './codeRegistrySeed';
import { isPublicCatalogEligible, isCreateSelectableStatus } from './catalogPolicy';

export type VisualCatalogSyncReport = {
  registryCount: number;
  catalogCount: number;
  inserted: number;
  versionsCreated: number;
  preserved: number;
  missingInDb: string[];
  orphanInDb: string[];
  dryRun: boolean;
};

function publicAssetUrl(objectKey: string): string | null {
  const base = (
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_URL ||
    ''
  ).replace(/\/$/, '');
  if (!base) return objectKey;
  return `${base}/${objectKey.replace(/^\//, '')}`;
}

/**
 * Idempotent sync: insert missing CODE registry templates as ACTIVE+visible.
 * Never overwrite operator fields (isVisible, featured, sortOrder, status, names).
 */
export async function syncVisualTemplateCatalogFromRegistry(options?: {
  dryRun?: boolean;
}): Promise<VisualCatalogSyncReport> {
  const dryRun = Boolean(options?.dryRun);
  const registryKeys = listCodeRegistryKeys();
  let inserted = 0;
  let versionsCreated = 0;
  let preserved = 0;

  for (const seed of CODE_VISUAL_TEMPLATE_SEEDS) {
    const existing = await prisma.visualTemplateCatalogEntry.findUnique({
      where: { templateKey: seed.templateKey },
      include: { versions: true },
    });

    if (existing) {
      preserved += 1;
      if (!existing.versions.some((v) => v.version === 1) && !dryRun) {
        const v1 = await prisma.visualTemplateVersion.create({
          data: {
            catalogEntryId: existing.id,
            version: 1,
            sourceType: VisualTemplateSourceType.CODE,
            status: VisualTemplateVersionStatus.ACTIVE,
            activatedAt: new Date(),
            sourceMetadataJson: {
              registryKey: seed.templateKey,
              thumbnailObjectKey: seed.thumbnailObjectKey,
            },
          },
        });
        versionsCreated += 1;
        if (!existing.activeVersionId) {
          await prisma.visualTemplateCatalogEntry.update({
            where: { id: existing.id },
            data: { activeVersionId: v1.id },
          });
        }
      }
      continue;
    }

    inserted += 1;
    if (dryRun) continue;

    const entry = await prisma.visualTemplateCatalogEntry.create({
      data: {
        templateKey: seed.templateKey,
        concept: seed.concept,
        displayNameKo: seed.displayNameKo,
        displayNameEn: seed.displayNameEn,
        descriptionKo: seed.descriptionKo,
        descriptionEn: seed.descriptionEn,
        sourceType: VisualTemplateSourceType.CODE,
        status: VisualTemplateCatalogStatus.ACTIVE,
        isVisible: true,
        isFeatured: false,
        isNew: false,
        isPremium: false,
        sortOrder: seed.sortOrder,
        thumbnailUrl: publicAssetUrl(seed.thumbnailObjectKey),
      },
    });

    const v1 = await prisma.visualTemplateVersion.create({
      data: {
        catalogEntryId: entry.id,
        version: 1,
        sourceType: VisualTemplateSourceType.CODE,
        status: VisualTemplateVersionStatus.ACTIVE,
        activatedAt: new Date(),
        sourceMetadataJson: {
          registryKey: seed.templateKey,
          thumbnailObjectKey: seed.thumbnailObjectKey,
        },
      },
    });
    versionsCreated += 1;

    await prisma.visualTemplateCatalogEntry.update({
      where: { id: entry.id },
      data: { activeVersionId: v1.id },
    });
  }

  const allEntries = await prisma.visualTemplateCatalogEntry.findMany({
    select: { templateKey: true, sourceType: true },
  });
  const dbKeys = allEntries.map((e) => e.templateKey);
  const missingInDb = registryKeys.filter((k) => !dbKeys.includes(k));
  const orphanInDb = allEntries
    .filter((e) => e.sourceType === VisualTemplateSourceType.CODE && !isCodeRegistryKey(e.templateKey))
    .map((e) => e.templateKey);

  return {
    registryCount: registryKeys.length,
    catalogCount: allEntries.length,
    inserted: dryRun ? inserted : inserted,
    versionsCreated,
    preserved,
    missingInDb,
    orphanInDb,
    dryRun,
  };
}

export async function getVisualCatalogDrift() {
  const entries = await prisma.visualTemplateCatalogEntry.findMany({
    select: {
      templateKey: true,
      sourceType: true,
      status: true,
      isVisible: true,
    },
  });
  const registryKeys = listCodeRegistryKeys();
  const dbKeys = entries.map((e) => e.templateKey);
  const missingInDb = registryKeys.filter((k) => !dbKeys.includes(k));
  const orphanInDb = entries
    .filter((e) => e.sourceType === 'CODE' && !isCodeRegistryKey(e.templateKey))
    .map((e) => e.templateKey);
  const activeVisibleCount = entries.filter(
    (e) => e.status === 'ACTIVE' && e.isVisible
  ).length;

  return {
    registryTemplateCount: registryKeys.length,
    catalogEntryCount: entries.length,
    activeVisibleCount,
    registryMissingCount: missingInDb.length,
    dbOrphanCount: orphanInDb.length,
    missingInDb,
    orphanInDb,
  };
}

let catalogCache: { at: number; payload: unknown } | null = null;
const CATALOG_CACHE_MS = 5_000;

export function invalidateVisualCatalogCache(): void {
  catalogCache = null;
}

export type PublicVisualCatalogItem = {
  templateKey: string;
  concept: string;
  displayName: string;
  description: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  featured: boolean;
  new: boolean;
  premium: boolean;
  sortOrder: number;
  activeVersion: number | null;
  sourceType: string;
};

/**
 * Public catalog: ACTIVE + visible + CODE registry exists (for CODE source).
 */
export async function listPublicVisualCatalog(input?: {
  concept?: string;
  locale?: string;
}): Promise<PublicVisualCatalogItem[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_CACHE_MS && !input?.concept) {
    return catalogCache.payload as PublicVisualCatalogItem[];
  }

  const where: {
    status: VisualTemplateCatalogStatus;
    isVisible: true;
    concept?: string;
  } = {
    status: VisualTemplateCatalogStatus.ACTIVE,
    isVisible: true,
  };
  if (input?.concept) where.concept = input.concept;

  const rows = await prisma.visualTemplateCatalogEntry.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { templateKey: 'asc' }],
    include: { activeVersion: true },
  });

  const locale = (input?.locale || '').toLowerCase();
  const useEn = locale.startsWith('en');

  const items: PublicVisualCatalogItem[] = [];
  for (const row of rows) {
    if (
      !isPublicCatalogEligible({
        status: row.status,
        isVisible: row.isVisible,
        sourceType: row.sourceType,
        templateKey: row.templateKey,
        registryHas: isCodeRegistryKey,
      })
    ) {
      continue;
    }
    items.push({
      templateKey: row.templateKey,
      concept: row.concept,
      displayName: useEn ? row.displayNameEn : row.displayNameKo,
      description: useEn ? row.descriptionEn : row.descriptionKo,
      thumbnailUrl: row.thumbnailUrl,
      previewUrl: row.previewUrl,
      featured: row.isFeatured,
      new: row.isNew,
      premium: row.isPremium,
      sortOrder: row.sortOrder,
      activeVersion: row.activeVersion?.version ?? null,
      sourceType: row.sourceType,
    });
  }

  if (!input?.concept) {
    catalogCache = { at: Date.now(), payload: items };
  }
  return items;
}

export async function assertVisualTemplateSelectable(input: {
  templateKey: string;
  concept: string;
}): Promise<{ ok: true; versionId: string | null } | { ok: false; code: string }> {
  if (!isCodeRegistryKey(input.templateKey)) {
    return { ok: false, code: 'VISUAL_TEMPLATE_NOT_IN_REGISTRY' };
  }

  const entry = await prisma.visualTemplateCatalogEntry.findUnique({
    where: { templateKey: input.templateKey },
    include: { activeVersion: true },
  });

  if (!entry) {
    return { ok: false, code: 'VISUAL_TEMPLATE_NOT_IN_CATALOG' };
  }
  if (entry.concept !== input.concept) {
    return { ok: false, code: 'VISUAL_TEMPLATE_CONCEPT_MISMATCH' };
  }
  const statusCheck = isCreateSelectableStatus({
    status: entry.status,
    isVisible: entry.isVisible,
  });
  if (!statusCheck.ok) return statusCheck;

  return { ok: true, versionId: entry.activeVersionId };
}
