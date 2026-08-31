/**
 * GI_* semantic parser — Figma node tree → TemplateDefinition (normalized).
 */
import crypto from 'crypto';
import type { FigmaNodeDocument } from '../../figma/client';
import { pickAllowlistedStyle } from './registries';
import type {
  DefinitionNode,
  DefinitionSection,
  DefinitionStyle,
  GiSectionId,
  TemplateDefinition,
} from './types';
import {
  TEMPLATE_DEFINITION_SCHEMA_VERSION,
  isGiComponentId,
  isGiCopyId,
  isGiFieldId,
  isGiMediaId,
  isGiSectionId,
} from './types';
import type { DefinitionIssue } from './validate';

export type GiParseResult = {
  definition: TemplateDefinition;
  issues: DefinitionIssue[];
  detectedSections: string[];
  detectedFields: string[];
  detectedComponents: string[];
  detectedMedia: string[];
  sourceHash: string;
};

type ParsedName =
  | { kind: 'TEMPLATE'; key: string }
  | { kind: 'VIEW'; view: 'MOBILE' | 'DESKTOP' }
  | { kind: 'SECTION'; id: string }
  | { kind: 'FIELD'; id: string }
  | { kind: 'MEDIA'; id: string }
  | { kind: 'REPEAT'; id: string }
  | { kind: 'COMPONENT'; id: string }
  | { kind: 'COPY'; id: string }
  | { kind: 'DECOR'; id: string }
  | { kind: 'UNKNOWN_GI'; raw: string }
  | { kind: 'PLAIN'; name: string };

export function parseGiLayerName(name: string): ParsedName {
  const raw = String(name || '').trim();
  if (!raw.startsWith('GI_')) return { kind: 'PLAIN', name: raw };

  if (raw.startsWith('GI_TEMPLATE/')) {
    return { kind: 'TEMPLATE', key: raw.slice('GI_TEMPLATE/'.length).trim() };
  }
  if (raw === 'GI_VIEW/MOBILE' || raw.endsWith('/MOBILE') && raw.includes('GI_VIEW')) {
    return { kind: 'VIEW', view: 'MOBILE' };
  }
  if (raw === 'GI_VIEW/DESKTOP' || (raw.includes('GI_VIEW') && raw.endsWith('/DESKTOP'))) {
    return { kind: 'VIEW', view: 'DESKTOP' };
  }
  if (raw.startsWith('GI_SECTION/')) {
    return { kind: 'SECTION', id: raw.slice('GI_SECTION/'.length).trim() };
  }
  if (raw.startsWith('GI_FIELD/')) {
    return { kind: 'FIELD', id: raw.slice('GI_FIELD/'.length).trim() };
  }
  if (raw.startsWith('GI_MEDIA/')) {
    return { kind: 'MEDIA', id: raw.slice('GI_MEDIA/'.length).trim() };
  }
  if (raw.startsWith('GI_REPEAT/')) {
    return { kind: 'REPEAT', id: raw.slice('GI_REPEAT/'.length).trim() };
  }
  if (raw.startsWith('GI_COMPONENT/')) {
    return { kind: 'COMPONENT', id: raw.slice('GI_COMPONENT/'.length).trim() };
  }
  if (raw.startsWith('GI_COPY/')) {
    return { kind: 'COPY', id: raw.slice('GI_COPY/'.length).trim() };
  }
  if (raw.startsWith('GI_DECOR/')) {
    return { kind: 'DECOR', id: raw.slice('GI_DECOR/'.length).trim() };
  }
  return { kind: 'UNKNOWN_GI', raw };
}

function colorFromFills(node: FigmaNodeDocument): string | undefined {
  const fills = Array.isArray(node.fills) ? node.fills : [];
  for (const fill of fills) {
    if (!fill || typeof fill !== 'object') continue;
    const f = fill as { type?: string; color?: { r: number; g: number; b: number; a?: number } };
    if (f.type === 'SOLID' && f.color) {
      const { r, g, b, a = 1 } = f.color;
      const to = (n: number) => Math.round(n * 255);
      if (a < 1) return `rgba(${to(r)},${to(g)},${to(b)},${a})`;
      return `#${[to(r), to(g), to(b)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  return undefined;
}

function extractStyle(node: FigmaNodeDocument, issues: DefinitionIssue[], path: string): DefinitionStyle {
  const style: DefinitionStyle = {};
  if (node.layoutMode === 'VERTICAL') {
    style.display = 'flex';
    style.flexDirection = 'column';
  } else if (node.layoutMode === 'HORIZONTAL') {
    style.display = 'flex';
    style.flexDirection = 'row';
  }
  if (typeof node.itemSpacing === 'number') style.gap = node.itemSpacing;
  if (typeof node.paddingTop === 'number') style.paddingTop = node.paddingTop;
  if (typeof node.paddingBottom === 'number') style.paddingBottom = node.paddingBottom;
  if (typeof node.paddingLeft === 'number') style.paddingLeft = node.paddingLeft;
  if (typeof node.paddingRight === 'number') style.paddingRight = node.paddingRight;
  if (typeof node.cornerRadius === 'number') style.borderRadius = node.cornerRadius;
  if (typeof node.opacity === 'number' && node.opacity < 1) style.opacity = node.opacity;

  const box = node.absoluteBoundingBox;
  if (box?.width) style.width = Math.round(box.width);
  if (box?.height) style.minHeight = Math.round(box.height);

  const fill = colorFromFills(node);
  if (fill) {
    if (node.type === 'TEXT') style.color = fill;
    else style.backgroundColor = fill;
  }

  const textStyle = node.style || {};
  if (typeof textStyle.fontSize === 'number') style.fontSize = textStyle.fontSize;
  if (typeof textStyle.fontWeight === 'number' || typeof textStyle.fontWeight === 'string') {
    style.fontWeight = textStyle.fontWeight as number | string;
  }
  if (typeof textStyle.lineHeightPx === 'number') style.lineHeight = textStyle.lineHeightPx;
  if (typeof textStyle.letterSpacing === 'number') style.letterSpacing = textStyle.letterSpacing;
  const align = String(textStyle.textAlignHorizontal || '');
  if (align === 'CENTER') style.textAlign = 'center';
  if (align === 'RIGHT') style.textAlign = 'right';
  if (align === 'LEFT') style.textAlign = 'left';

  if (node.blendMode && node.blendMode !== 'PASS_THROUGH' && node.blendMode !== 'NORMAL') {
    issues.push({
      level: 'WARNING',
      code: 'UNSUPPORTED_BLEND',
      message: `Unsupported blend ${node.blendMode}`,
      path,
    });
  }
  if (Array.isArray(node.effects) && node.effects.length > 0) {
    issues.push({
      level: 'WARNING',
      code: 'UNSUPPORTED_EFFECT',
      message: 'Effects partially unsupported',
      path,
    });
  }
  if (!node.layoutMode && node.type === 'FRAME' && Array.isArray(node.children) && node.children.length > 3) {
    issues.push({
      level: 'WARNING',
      code: 'ABSOLUTE_LAYOUT',
      message: 'Frame without Auto Layout — absolute positioning risk',
      path,
    });
  }

  return pickAllowlistedStyle(style as Record<string, unknown>) as DefinitionStyle;
}

function walkToNodes(
  node: FigmaNodeDocument,
  issues: DefinitionIssue[],
  path: string,
  counters: { id: number }
): DefinitionNode[] {
  const parsed = parseGiLayerName(node.name);
  const style = extractStyle(node, issues, path);
  const nextId = () => `n${++counters.id}`;

  if (parsed.kind === 'UNKNOWN_GI') {
    issues.push({
      level: 'WARNING',
      code: 'UNKNOWN_GI_PREFIX',
      message: `Unknown GI layer ${parsed.raw}`,
      path,
    });
  }

  if (parsed.kind === 'FIELD') {
    if (!isGiFieldId(parsed.id)) {
      issues.push({
        level: 'ERROR',
        code: 'INVALID_BINDING',
        message: `Unknown field ${parsed.id}`,
        path,
      });
    }
    return [
      {
        id: nextId(),
        type: 'FIELD',
        binding: isGiFieldId(parsed.id) ? parsed.id : undefined,
        fallbackText: node.characters || parsed.id,
        style,
      },
    ];
  }

  if (parsed.kind === 'MEDIA') {
    return [
      {
        id: nextId(),
        type: 'IMAGE',
        media: isGiMediaId(parsed.id) ? parsed.id : undefined,
        alt: parsed.id,
        style: { ...style, objectFit: 'cover' },
      },
    ];
  }

  if (parsed.kind === 'COMPONENT') {
    if (!isGiComponentId(parsed.id)) {
      issues.push({
        level: 'ERROR',
        code: 'INVALID_COMPONENT',
        message: `Unknown component ${parsed.id}`,
        path,
      });
    }
    return [
      {
        id: nextId(),
        type: 'COMPONENT',
        component: isGiComponentId(parsed.id) ? parsed.id : undefined,
        style,
      },
    ];
  }

  if (parsed.kind === 'COPY') {
    return [
      {
        id: nextId(),
        type: 'COPY',
        copyKey: isGiCopyId(parsed.id) ? parsed.id : undefined,
        style,
      },
    ];
  }

  if (parsed.kind === 'DECOR') {
    return [
      {
        id: nextId(),
        type: 'DECORATION',
        alt: parsed.id,
        style,
        text: node.characters,
      },
    ];
  }

  if (parsed.kind === 'REPEAT') {
    const children = (node.children || []).flatMap((c, i) =>
      walkToNodes(c, issues, `${path}/${c.name || i}`, counters)
    );
    return [
      {
        id: nextId(),
        type: 'REPEAT',
        repeatOf: parsed.id === 'GALLERY' ? 'GALLERY' : undefined,
        style,
        children: children.slice(0, 1),
      },
    ];
  }

  if (node.type === 'TEXT' || node.characters) {
    return [
      {
        id: nextId(),
        type: 'TEXT',
        text: node.characters || '',
        style,
      },
    ];
  }

  const children = (node.children || []).flatMap((c, i) =>
    walkToNodes(c, issues, `${path}/${c.name || i}`, counters)
  );
  if (children.length === 0) {
    return [{ id: nextId(), type: 'CONTAINER', style }];
  }
  return [{ id: nextId(), type: 'CONTAINER', style, children }];
}

function findSections(
  root: FigmaNodeDocument,
  issues: DefinitionIssue[]
): { sections: DefinitionSection[]; view: 'MOBILE' | 'DESKTOP' | null } {
  let viewRoot: FigmaNodeDocument = root;
  let view: 'MOBILE' | 'DESKTOP' | null = null;

  const directViews = (root.children || []).filter((c) => {
    const p = parseGiLayerName(c.name);
    return p.kind === 'VIEW';
  });
  const mobile = directViews.find((c) => parseGiLayerName(c.name).kind === 'VIEW' && (parseGiLayerName(c.name) as { view: string }).view === 'MOBILE');
  if (mobile) {
    viewRoot = mobile;
    view = 'MOBILE';
  }

  const sectionNodes: FigmaNodeDocument[] = [];
  const collect = (node: FigmaNodeDocument) => {
    const p = parseGiLayerName(node.name);
    if (p.kind === 'SECTION') {
      sectionNodes.push(node);
      return;
    }
    (node.children || []).forEach(collect);
  };
  collect(viewRoot);

  const counters = { id: 0 };
  const sections: DefinitionSection[] = [];
  for (const sn of sectionNodes) {
    const p = parseGiLayerName(sn.name);
    if (p.kind !== 'SECTION') continue;
    if (!isGiSectionId(p.id)) {
      issues.push({
        level: 'WARNING',
        code: 'UNSUPPORTED_SECTION',
        message: `Unsupported section ${p.id}`,
      });
    }
    const nodes = (sn.children || []).flatMap((c, i) =>
      walkToNodes(c, issues, `${p.id}/${c.name || i}`, counters)
    );
    sections.push({
      id: (isGiSectionId(p.id) ? p.id : p.id) as GiSectionId,
      style: extractStyle(sn, issues, p.id),
      nodes,
    });
  }
  return { sections, view };
}

export function parseFigmaTemplateNode(input: {
  root: FigmaNodeDocument;
  expectedTemplateKey: string;
  concept: TemplateDefinition['concept'];
  source: TemplateDefinition['source'];
}): GiParseResult {
  const issues: DefinitionIssue[] = [];
  const top = parseGiLayerName(input.root.name);

  if (top.kind !== 'TEMPLATE') {
    issues.push({
      level: 'ERROR',
      code: 'TOP_FRAME_INVALID',
      message: `Top frame must be GI_TEMPLATE/<KEY>, got "${input.root.name}"`,
    });
  } else if (top.key !== input.expectedTemplateKey) {
    issues.push({
      level: 'ERROR',
      code: 'TEMPLATE_KEY_MISMATCH',
      message: `Frame key ${top.key} !== ${input.expectedTemplateKey}`,
    });
  }

  const { sections } = findSections(input.root, issues);
  const width = Math.round(input.root.absoluteBoundingBox?.width || 390);

  const definition: TemplateDefinition = {
    schemaVersion: TEMPLATE_DEFINITION_SCHEMA_VERSION,
    templateKey: input.expectedTemplateKey,
    concept: input.concept,
    source: input.source,
    mobile: { width: width || 390, sections },
  };

  const detectedSections = sections.map((s) => s.id);
  const detectedFields: string[] = [];
  const detectedComponents: string[] = [];
  const detectedMedia: string[] = [];
  const walk = (nodes: DefinitionNode[]) => {
    for (const n of nodes) {
      if (n.binding) detectedFields.push(n.binding);
      if (n.component) detectedComponents.push(n.component);
      if (n.media) detectedMedia.push(n.media);
      if (n.children) walk(n.children);
    }
  };
  sections.forEach((s) => walk(s.nodes));

  const sourceHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ name: input.root.name, sections: detectedSections, fields: detectedFields }))
    .digest('hex')
    .slice(0, 32);

  definition.source = { ...definition.source, sourceHash };

  return {
    definition,
    issues,
    detectedSections,
    detectedFields: [...new Set(detectedFields)],
    detectedComponents: [...new Set(detectedComponents)],
    detectedMedia: [...new Set(detectedMedia)],
    sourceHash,
  };
}
