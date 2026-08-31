/**
 * TemplateDefinition validation — ERROR blocks save; WARNING allows DRAFT.
 */
import {
  GI_SECTIONS,
  MAX_DEFINITION_DEPTH,
  MAX_DEFINITION_JSON_BYTES,
  MAX_DEFINITION_NODES,
  TEMPLATE_DEFINITION_SCHEMA_VERSION,
  WEDDING_POC_REQUIRED_SECTIONS,
  isGiComponentId,
  isGiCopyId,
  isGiFieldId,
  isGiMediaId,
  isGiSectionId,
  type DefinitionNode,
  type DefinitionSection,
  type TemplateDefinition,
} from './types';
import { pickAllowlistedStyle } from './registries';

export type DefinitionIssue = {
  level: 'ERROR' | 'WARNING';
  code: string;
  message: string;
  path?: string;
};

function countNodes(nodes: DefinitionNode[], depth: number, acc: { count: number; maxDepth: number }) {
  acc.maxDepth = Math.max(acc.maxDepth, depth);
  for (const node of nodes) {
    acc.count += 1;
    if (node.children?.length) countNodes(node.children, depth + 1, acc);
  }
}

function validateNode(node: DefinitionNode, path: string, issues: DefinitionIssue[]) {
  if (!node.id || !node.type) {
    issues.push({ level: 'ERROR', code: 'NODE_INVALID', message: 'Node missing id/type', path });
    return;
  }
  if (node.binding && !isGiFieldId(node.binding)) {
    issues.push({
      level: 'ERROR',
      code: 'INVALID_BINDING',
      message: `Unknown field binding ${node.binding}`,
      path,
    });
  }
  if (node.component && !isGiComponentId(node.component)) {
    issues.push({
      level: 'ERROR',
      code: 'INVALID_COMPONENT',
      message: `Unknown component ${node.component}`,
      path,
    });
  }
  if (node.copyKey && !isGiCopyId(node.copyKey)) {
    issues.push({
      level: 'ERROR',
      code: 'INVALID_COPY',
      message: `Unknown copy key ${node.copyKey}`,
      path,
    });
  }
  if (node.media && !isGiMediaId(node.media)) {
    issues.push({
      level: 'ERROR',
      code: 'INVALID_MEDIA',
      message: `Unknown media ${node.media}`,
      path,
    });
  }
  if (node.style) {
    node.style = pickAllowlistedStyle(node.style as Record<string, unknown>) as DefinitionNode['style'];
  }
  node.children?.forEach((child, i) => validateNode(child, `${path}.children[${i}]`, issues));
}

export function validateTemplateDefinition(
  raw: unknown,
  options?: { expectedTemplateKey?: string }
): { ok: boolean; definition: TemplateDefinition | null; issues: DefinitionIssue[] } {
  const issues: DefinitionIssue[] = [];
  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      definition: null,
      issues: [{ level: 'ERROR', code: 'SCHEMA_INVALID', message: 'Definition must be an object' }],
    };
  }

  const def = raw as TemplateDefinition;
  if (def.schemaVersion !== TEMPLATE_DEFINITION_SCHEMA_VERSION) {
    issues.push({
      level: 'ERROR',
      code: 'SCHEMA_VERSION',
      message: `Expected schemaVersion ${TEMPLATE_DEFINITION_SCHEMA_VERSION}`,
    });
  }
  if (!def.templateKey || typeof def.templateKey !== 'string') {
    issues.push({ level: 'ERROR', code: 'TEMPLATE_KEY_REQUIRED', message: 'templateKey required' });
  }
  if (options?.expectedTemplateKey && def.templateKey !== options.expectedTemplateKey) {
    issues.push({
      level: 'ERROR',
      code: 'TEMPLATE_KEY_MISMATCH',
      message: `Definition key ${def.templateKey} !== ${options.expectedTemplateKey}`,
    });
  }
  if (!['WEDDING', 'FUNERAL', 'GENERAL', 'ORGANIZATION'].includes(def.concept)) {
    issues.push({ level: 'ERROR', code: 'CONCEPT_INVALID', message: 'Invalid concept' });
  }
  if (!def.mobile?.sections || !Array.isArray(def.mobile.sections)) {
    issues.push({ level: 'ERROR', code: 'MOBILE_REQUIRED', message: 'mobile.sections required' });
  }

  const sections = def.mobile?.sections || [];
  const seen = new Set<string>();
  for (const section of sections) {
    if (!isGiSectionId(section.id)) {
      issues.push({
        level: 'WARNING',
        code: 'UNSUPPORTED_SECTION',
        message: `Unsupported section ${section.id}`,
      });
      continue;
    }
    if (seen.has(section.id)) {
      issues.push({
        level: 'WARNING',
        code: 'DUPLICATE_SECTION',
        message: `Duplicate section ${section.id}`,
      });
    }
    seen.add(section.id);
    section.nodes?.forEach((n, i) => validateNode(n, `${section.id}[${i}]`, issues));
  }

  if (def.concept === 'WEDDING') {
    for (const req of WEDDING_POC_REQUIRED_SECTIONS) {
      if (!seen.has(req)) {
        issues.push({
          level: 'ERROR',
          code: 'REQUIRED_SECTION_MISSING',
          message: `Wedding requires section ${req}`,
        });
      }
    }
  }

  const stats = { count: 0, maxDepth: 0 };
  for (const section of sections) {
    countNodes(section.nodes || [], 1, stats);
  }
  if (stats.maxDepth > MAX_DEFINITION_DEPTH) {
    issues.push({
      level: 'ERROR',
      code: 'MAX_DEPTH',
      message: `Node depth ${stats.maxDepth} > ${MAX_DEFINITION_DEPTH}`,
    });
  }
  if (stats.count > MAX_DEFINITION_NODES) {
    issues.push({
      level: 'ERROR',
      code: 'MAX_NODES',
      message: `Node count ${stats.count} > ${MAX_DEFINITION_NODES}`,
    });
  }

  const size = Buffer.byteLength(JSON.stringify(def), 'utf8');
  if (size > MAX_DEFINITION_JSON_BYTES) {
    issues.push({
      level: 'ERROR',
      code: 'DEFINITION_TOO_LARGE',
      message: `Definition ${size} bytes exceeds ${MAX_DEFINITION_JSON_BYTES}`,
    });
  } else if (size > 200_000) {
    issues.push({
      level: 'WARNING',
      code: 'DEFINITION_LARGE',
      message: `Definition size ${size} bytes`,
    });
  }

  // Normalize unknown sections out of known list for storage? Keep as-is but filter errors.
  const hasError = issues.some((i) => i.level === 'ERROR');
  return { ok: !hasError, definition: hasError ? null : def, issues };
}

export function listSupportedSections(): string[] {
  return [...GI_SECTIONS];
}

export function summarizeDefinition(def: TemplateDefinition) {
  const sections = (def.mobile.sections || []).map((s: DefinitionSection) => s.id);
  const fields = new Set<string>();
  const components = new Set<string>();
  const walk = (nodes: DefinitionNode[]) => {
    for (const n of nodes) {
      if (n.binding) fields.add(n.binding);
      if (n.component) components.add(n.component);
      if (n.children) walk(n.children);
    }
  };
  for (const s of def.mobile.sections || []) walk(s.nodes || []);
  return {
    sections,
    fields: [...fields],
    components: [...components],
  };
}
