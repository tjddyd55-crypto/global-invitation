/**
 * Figma analyze / import / version workflow for Visual Template Catalog.
 */
import {
  Prisma,
  VisualTemplateCatalogStatus,
  VisualTemplateSourceType,
  VisualTemplateVersionStatus,
} from '@prisma/client';
import prisma from '../../prisma';
import { figmaGetFileNodes, FigmaApiError } from '../../figma/client';
import { resolveFigmaAccessToken } from '../../figma/config';
import { parseFigmaFrameUrl } from '../../figma/urlParser';
import { parseFigmaTemplateNode } from './giParser';
import { validateTemplateDefinition, summarizeDefinition, type DefinitionIssue } from './validate';
import { buildWeddingPocFixtureDefinition, WEDDING_POC_TEMPLATE_KEY } from './weddingPocFixture';
import type { TemplateDefinition } from './types';
import { invalidateVisualCatalogCache } from '../catalogService';

export type AnalyzeResult = {
  source: { fileKey: string; nodeId: string; frameName: string; url: string };
  detectedSections: string[];
  detectedFields: string[];
  detectedComponents: string[];
  detectedMedia: string[];
  warnings: DefinitionIssue[];
  errors: DefinitionIssue[];
  definitionPreview: TemplateDefinition | null;
  sourceHash: string;
  canSaveDraft: boolean;
};

export async function analyzeFigmaFrame(input: {
  figmaUrl: string;
  templateKey: string;
  concept: TemplateDefinition['concept'];
}): Promise<AnalyzeResult> {
  const parsed = parseFigmaFrameUrl(input.figmaUrl);
  const creds = await resolveFigmaAccessToken();
  if (!creds) {
    throw new FigmaApiError('FIGMA_NOT_CONFIGURED');
  }

  const file = await figmaGetFileNodes({
    token: creds.token,
    fileKey: parsed.fileKey,
    nodeIds: [parsed.nodeIdColon],
  });

  const nodeEntry = file.nodes[parsed.nodeIdColon] || file.nodes[parsed.nodeIdDash];
  const document = nodeEntry?.document;
  if (!document) {
    throw new FigmaApiError('FIGMA_NODE_NOT_FOUND');
  }

  const parsedTree = parseFigmaTemplateNode({
    root: document,
    expectedTemplateKey: input.templateKey,
    concept: input.concept,
    source: {
      type: 'FIGMA',
      fileKey: parsed.fileKey,
      nodeId: parsed.nodeIdColon,
      url: parsed.originalUrl,
    },
  });

  const validated = validateTemplateDefinition(parsedTree.definition, {
    expectedTemplateKey: input.templateKey,
  });

  const issues = [...parsedTree.issues, ...validated.issues];
  const errors = issues.filter((i) => i.level === 'ERROR');
  const warnings = issues.filter((i) => i.level === 'WARNING');

  return {
    source: {
      fileKey: parsed.fileKey,
      nodeId: parsed.nodeIdColon,
      frameName: document.name,
      url: parsed.originalUrl,
    },
    detectedSections: parsedTree.detectedSections,
    detectedFields: parsedTree.detectedFields,
    detectedComponents: parsedTree.detectedComponents,
    detectedMedia: parsedTree.detectedMedia,
    warnings,
    errors,
    definitionPreview: validated.definition,
    sourceHash: parsedTree.sourceHash,
    canSaveDraft: errors.length === 0 && Boolean(validated.definition),
  };
}

export async function analyzeWeddingPocFixture(): Promise<AnalyzeResult> {
  const definition = buildWeddingPocFixtureDefinition();
  const validated = validateTemplateDefinition(definition, {
    expectedTemplateKey: WEDDING_POC_TEMPLATE_KEY,
  });
  const summary = summarizeDefinition(definition);
  const errors = validated.issues.filter((i) => i.level === 'ERROR');
  const warnings = validated.issues.filter((i) => i.level === 'WARNING');
  return {
    source: {
      fileKey: 'fixture',
      nodeId: '0:1',
      frameName: `GI_TEMPLATE/${WEDDING_POC_TEMPLATE_KEY}`,
      url: 'fixture://wedding-07',
    },
    detectedSections: summary.sections,
    detectedFields: summary.fields,
    detectedComponents: summary.components,
    detectedMedia: ['HERO_IMAGE', 'GALLERY_IMAGE'],
    warnings,
    errors,
    definitionPreview: validated.definition,
    sourceHash: definition.source.sourceHash || 'fixture',
    canSaveDraft: errors.length === 0,
  };
}

export async function saveDefinitionDraft(input: {
  templateKey: string;
  concept: TemplateDefinition['concept'];
  displayNameKo: string;
  displayNameEn: string;
  descriptionKo?: string;
  descriptionEn?: string;
  definition: TemplateDefinition;
  figmaMeta?: {
    fileKey?: string;
    nodeId?: string;
    url?: string;
    sourceHash?: string;
    warnings?: DefinitionIssue[];
  };
  actor: string;
}): Promise<{ catalogEntryId: string; versionId: string; version: number }> {
  const validated = validateTemplateDefinition(input.definition, {
    expectedTemplateKey: input.templateKey,
  });
  if (!validated.ok || !validated.definition) {
    throw new Error('DEFINITION_VALIDATION_FAILED');
  }

  return prisma.$transaction(async (tx) => {
    let entry = await tx.visualTemplateCatalogEntry.findUnique({
      where: { templateKey: input.templateKey },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!entry) {
      entry = await tx.visualTemplateCatalogEntry.create({
        data: {
          templateKey: input.templateKey,
          concept: input.concept,
          displayNameKo: input.displayNameKo,
          displayNameEn: input.displayNameEn,
          descriptionKo: input.descriptionKo || '',
          descriptionEn: input.descriptionEn || '',
          sourceType: VisualTemplateSourceType.FIGMA_DEFINITION,
          status: VisualTemplateCatalogStatus.DRAFT,
          isVisible: false,
          isFeatured: false,
          isNew: true,
          sortOrder: 100,
        },
        include: { versions: true },
      });
    } else if (entry.sourceType === VisualTemplateSourceType.CODE) {
      throw new Error('CANNOT_ATTACH_FIGMA_TO_CODE_ENTRY');
    }

    const nextVersion = (entry.versions[0]?.version || 0) + 1;
    const version = await tx.visualTemplateVersion.create({
      data: {
        catalogEntryId: entry.id,
        version: nextVersion,
        sourceType: VisualTemplateSourceType.FIGMA_DEFINITION,
        status: VisualTemplateVersionStatus.DRAFT,
        definitionJson: validated.definition as unknown as Prisma.InputJsonValue,
        sourceMetadataJson: {
          figmaFileKey: input.figmaMeta?.fileKey || null,
          figmaNodeId: input.figmaMeta?.nodeId || null,
          figmaUrl: input.figmaMeta?.url || null,
          sourceHash:
            input.figmaMeta?.sourceHash ||
            validated.definition?.source.sourceHash ||
            null,
          importWarnings: input.figmaMeta?.warnings || [],
          importedBy: input.actor,
        } as Prisma.InputJsonValue,
      },
    });

    await tx.visualTemplateCatalogEntry.update({
      where: { id: entry.id },
      data: {
        status: VisualTemplateCatalogStatus.DRAFT,
        isVisible: false,
        displayNameKo: input.displayNameKo,
        displayNameEn: input.displayNameEn,
      },
    });

    invalidateVisualCatalogCache();
    return { catalogEntryId: entry.id, versionId: version.id, version: nextVersion };
  });
}

export async function markVersionQaReady(versionId: string) {
  const version = await prisma.visualTemplateVersion.update({
    where: { id: versionId },
    data: { status: VisualTemplateVersionStatus.QA_READY },
    include: { catalogEntry: true },
  });
  await prisma.visualTemplateCatalogEntry.update({
    where: { id: version.catalogEntryId },
    data: { status: VisualTemplateCatalogStatus.QA_READY },
  });
  invalidateVisualCatalogCache();
  return version;
}

/**
 * Activate version: set as catalog activeVersion, catalog ACTIVE, isVisible=false by default.
 */
export async function activateDefinitionVersion(versionId: string) {
  return prisma.$transaction(async (tx) => {
    const version = await tx.visualTemplateVersion.findUnique({
      where: { id: versionId },
      include: { catalogEntry: true },
    });
    if (!version) throw new Error('VERSION_NOT_FOUND');
    if (version.sourceType !== VisualTemplateSourceType.FIGMA_DEFINITION) {
      throw new Error('NOT_FIGMA_VERSION');
    }
    const validated = validateTemplateDefinition(version.definitionJson, {
      expectedTemplateKey: version.catalogEntry.templateKey,
    });
    if (!validated.ok) throw new Error('DEFINITION_INVALID');

    // Archive previous active FIGMA versions for this entry
    await tx.visualTemplateVersion.updateMany({
      where: {
        catalogEntryId: version.catalogEntryId,
        status: VisualTemplateVersionStatus.ACTIVE,
        id: { not: version.id },
      },
      data: {
        status: VisualTemplateVersionStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    const activated = await tx.visualTemplateVersion.update({
      where: { id: version.id },
      data: {
        status: VisualTemplateVersionStatus.ACTIVE,
        activatedAt: new Date(),
      },
    });

    await tx.visualTemplateCatalogEntry.update({
      where: { id: version.catalogEntryId },
      data: {
        activeVersionId: activated.id,
        status: VisualTemplateCatalogStatus.ACTIVE,
        isVisible: false,
        sourceType: VisualTemplateSourceType.FIGMA_DEFINITION,
      },
    });

    invalidateVisualCatalogCache();
    return activated;
  });
}

export async function getActiveDefinitionForTemplateKey(
  templateKey: string
): Promise<{ versionId: string; definition: TemplateDefinition } | null> {
  const entry = await prisma.visualTemplateCatalogEntry.findUnique({
    where: { templateKey },
    include: { activeVersion: true },
  });
  if (!entry?.activeVersion) return null;
  if (entry.activeVersion.sourceType !== VisualTemplateSourceType.FIGMA_DEFINITION) return null;
  const validated = validateTemplateDefinition(entry.activeVersion.definitionJson, {
    expectedTemplateKey: templateKey,
  });
  if (!validated.ok || !validated.definition) return null;
  return { versionId: entry.activeVersion.id, definition: validated.definition };
}

export async function getDefinitionByVersionId(
  versionId: string
): Promise<{ versionId: string; templateKey: string; definition: TemplateDefinition } | null> {
  const version = await prisma.visualTemplateVersion.findUnique({
    where: { id: versionId },
    include: { catalogEntry: true },
  });
  if (!version || version.sourceType !== VisualTemplateSourceType.FIGMA_DEFINITION) return null;
  const validated = validateTemplateDefinition(version.definitionJson, {
    expectedTemplateKey: version.catalogEntry.templateKey,
  });
  if (!validated.ok || !validated.definition) return null;
  return {
    versionId: version.id,
    templateKey: version.catalogEntry.templateKey,
    definition: validated.definition,
  };
}
