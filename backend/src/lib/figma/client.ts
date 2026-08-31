/**
 * Figma REST API client — admin-only, timeout + size limits.
 * Cursor Figma MCP is NOT used at runtime.
 */

const FIGMA_API_BASE = 'https://api.figma.com';
const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024; // 8MB

export type FigmaApiErrorCode =
  | 'FIGMA_NOT_CONFIGURED'
  | 'FIGMA_UNAUTHORIZED'
  | 'FIGMA_FILE_NOT_FOUND'
  | 'FIGMA_NODE_NOT_FOUND'
  | 'FIGMA_RATE_LIMITED'
  | 'FIGMA_TIMEOUT'
  | 'FIGMA_IMPORT_FAILED';

export class FigmaApiError extends Error {
  constructor(
    public readonly code: FigmaApiErrorCode,
    message?: string
  ) {
    super(message || code);
    this.name = 'FigmaApiError';
  }
}

async function figmaFetch(
  path: string,
  token: string,
  options?: { timeoutMs?: number }
): Promise<unknown> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${FIGMA_API_BASE}${path}`, {
      method: 'GET',
      headers: {
        'X-Figma-Token': token,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new FigmaApiError('FIGMA_UNAUTHORIZED');
    }
    if (response.status === 404) {
      throw new FigmaApiError('FIGMA_FILE_NOT_FOUND');
    }
    if (response.status === 429) {
      throw new FigmaApiError('FIGMA_RATE_LIMITED');
    }
    if (!response.ok) {
      throw new FigmaApiError('FIGMA_IMPORT_FAILED', `HTTP_${response.status}`);
    }

    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.byteLength > MAX_RESPONSE_BYTES) {
      throw new FigmaApiError('FIGMA_IMPORT_FAILED', 'RESPONSE_TOO_LARGE');
    }
    return JSON.parse(buf.toString('utf8')) as unknown;
  } catch (error) {
    if (error instanceof FigmaApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FigmaApiError('FIGMA_TIMEOUT');
    }
    throw new FigmaApiError(
      'FIGMA_IMPORT_FAILED',
      error instanceof Error ? error.message : 'UNKNOWN'
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function figmaGetMe(token: string): Promise<{ id: string; email?: string; handle?: string }> {
  const json = (await figmaFetch('/v1/me', token)) as {
    id?: string;
    email?: string;
    handle?: string;
  };
  if (!json?.id) throw new FigmaApiError('FIGMA_IMPORT_FAILED', 'ME_INVALID');
  return { id: String(json.id), email: json.email, handle: json.handle };
}

export type FigmaNodeDocument = {
  id: string;
  name: string;
  type: string;
  children?: FigmaNodeDocument[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: unknown[];
  strokes?: unknown[];
  effects?: unknown[];
  style?: Record<string, unknown>;
  characters?: string;
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  cornerRadius?: number;
  opacity?: number;
  clipsContent?: boolean;
  blendMode?: string;
  [key: string]: unknown;
};

export async function figmaGetFileNodes(input: {
  token: string;
  fileKey: string;
  nodeIds: string[];
}): Promise<{
  name: string;
  nodes: Record<string, { document: FigmaNodeDocument | null; components?: unknown }>;
}> {
  const ids = input.nodeIds.map((id) => id.replace(/-/g, ':')).join(',');
  const path = `/v1/files/${encodeURIComponent(input.fileKey)}/nodes?ids=${encodeURIComponent(ids)}`;
  const json = (await figmaFetch(path, input.token)) as {
    name?: string;
    nodes?: Record<string, { document: FigmaNodeDocument | null }>;
  };
  if (!json?.nodes) {
    throw new FigmaApiError('FIGMA_NODE_NOT_FOUND');
  }
  return { name: json.name || '', nodes: json.nodes };
}

export async function figmaGetImages(input: {
  token: string;
  fileKey: string;
  nodeIds: string[];
  format?: 'png' | 'svg' | 'jpg';
  scale?: number;
}): Promise<Record<string, string | null>> {
  const ids = input.nodeIds.map((id) => id.replace(/-/g, ':')).join(',');
  const format = input.format || 'png';
  const scale = input.scale ?? 2;
  const path = `/v1/images/${encodeURIComponent(input.fileKey)}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`;
  const json = (await figmaFetch(path, input.token)) as {
    images?: Record<string, string | null>;
    err?: string;
  };
  if (json.err) throw new FigmaApiError('FIGMA_IMPORT_FAILED', json.err);
  return json.images || {};
}
