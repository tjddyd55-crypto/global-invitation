/**
 * Figma REST API client — admin-only, timeout + size limits.
 * Cursor Figma MCP is NOT used at runtime.
 */

const FIGMA_API_BASE = 'https://api.figma.com';
const DEFAULT_TIMEOUT_MS = 25_000;
const CONNECTION_PROBE_TIMEOUT_MS = 8_000;

function resolveConnectionProbeTimeoutMs(): number {
  const raw = Number(process.env.FIGMA_PROBE_TIMEOUT_MS || '');
  if (Number.isFinite(raw) && raw > 0) return raw;
  return CONNECTION_PROBE_TIMEOUT_MS;
}
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024; // 8MB
const CONNECTION_PROBE_FILE_KEY = '__gi_connection_probe__';

export type FigmaApiErrorCode =
  | 'FIGMA_NOT_CONFIGURED'
  | 'FIGMA_TOKEN_NOT_CONFIGURED'
  | 'FIGMA_TOKEN_INVALID'
  | 'FIGMA_SCOPE_INSUFFICIENT'
  | 'FIGMA_API_FORBIDDEN'
  | 'FIGMA_UNAUTHORIZED'
  | 'FIGMA_FILE_NOT_FOUND'
  | 'FIGMA_NODE_NOT_FOUND'
  | 'FIGMA_RATE_LIMITED'
  | 'FIGMA_TIMEOUT'
  | 'FIGMA_API_TIMEOUT'
  | 'FIGMA_API_UNREACHABLE'
  | 'FIGMA_IMPORT_FAILED';

export type FigmaCredentialProbeResult = {
  ok: boolean;
  code: string;
  message: string;
};

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
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    throw new FigmaApiError('FIGMA_TOKEN_NOT_CONFIGURED');
  }
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${FIGMA_API_BASE}${path}`, {
      method: 'GET',
      headers: {
        'X-Figma-Token': trimmedToken,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 401) {
      throw new FigmaApiError('FIGMA_TOKEN_INVALID');
    }
    if (response.status === 403) {
      throw new FigmaApiError('FIGMA_API_FORBIDDEN');
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

/**
 * Auth probe aligned with runtime import (`file_content:read`).
 * Uses a non-existent file key: 404 means token+scope accepted; no payment or file mutation.
 */
export async function probeFigmaCredentials(token: string): Promise<FigmaCredentialProbeResult> {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return {
      ok: false,
      code: 'FIGMA_TOKEN_NOT_CONFIGURED',
      message: 'Figma Access Token is not configured.',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), resolveConnectionProbeTimeoutMs());
  try {
    const response = await fetch(
      `${FIGMA_API_BASE}/v1/files/${encodeURIComponent(CONNECTION_PROBE_FILE_KEY)}`,
      {
        method: 'GET',
        headers: {
          'X-Figma-Token': trimmedToken,
          Accept: 'application/json',
        },
        signal: controller.signal,
      }
    );

    if (response.status === 401) {
      return {
        ok: false,
        code: 'FIGMA_TOKEN_INVALID',
        message: 'Figma rejected the access token.',
      };
    }
    if (response.status === 403) {
      return {
        ok: false,
        code: 'FIGMA_SCOPE_INSUFFICIENT',
        message: 'Token is valid but lacks file_content:read (and related import scopes).',
      };
    }
    if (response.status === 404 || response.ok) {
      return {
        ok: true,
        code: 'FIGMA_AUTH_OK',
        message:
          'Figma file API auth accepted. Individual file access still depends on file sharing permissions.',
      };
    }
    if (response.status === 429) {
      return {
        ok: false,
        code: 'FIGMA_RATE_LIMITED',
        message: 'Figma API rate limit exceeded.',
      };
    }
    return {
      ok: false,
      code: 'FIGMA_IMPORT_FAILED',
      message: `Unexpected Figma API response (${response.status}).`,
    };
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === 'AbortError') ||
      (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError');
    if (aborted) {
      return {
        ok: false,
        code: 'FIGMA_API_TIMEOUT',
        message: 'Figma API connection timed out.',
      };
    }
    return {
      ok: false,
      code: 'FIGMA_API_UNREACHABLE',
      message: 'Figma API is unreachable.',
    };
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
