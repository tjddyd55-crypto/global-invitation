/**
 * Figma design URL parser — host allowlist only (SSRF-safe).
 */

export type ParsedFigmaUrl = {
  fileKey: string;
  nodeId: string;
  /** Normalized colon form e.g. 123:456 */
  nodeIdColon: string;
  /** Dash form e.g. 123-456 */
  nodeIdDash: string;
  originalUrl: string;
};

const ALLOWED_HOSTS = new Set(['www.figma.com', 'figma.com']);

function normalizeNodeId(raw: string): { colon: string; dash: string } {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('FIGMA_NODE_ID_MISSING');
  const colon = trimmed.includes(':') ? trimmed : trimmed.replace(/-/g, ':');
  const dash = colon.replace(/:/g, '-');
  if (!/^\d+:\d+$/.test(colon)) {
    throw new Error('FIGMA_NODE_ID_INVALID');
  }
  return { colon, dash };
}

export function parseFigmaFrameUrl(rawUrl: string): ParsedFigmaUrl {
  let url: URL;
  try {
    url = new URL(String(rawUrl || '').trim());
  } catch {
    throw new Error('FIGMA_URL_INVALID');
  }

  if (url.protocol !== 'https:') {
    throw new Error('FIGMA_URL_INVALID_PROTOCOL');
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error('FIGMA_URL_HOST_NOT_ALLOWED');
  }

  // /design/:fileKey/:name or /file/:fileKey/:name
  const parts = url.pathname.split('/').filter(Boolean);
  const kind = parts[0];
  if (kind !== 'design' && kind !== 'file') {
    throw new Error('FIGMA_URL_PATH_UNSUPPORTED');
  }
  const fileKey = parts[1];
  if (!fileKey || !/^[a-zA-Z0-9]+$/.test(fileKey)) {
    throw new Error('FIGMA_FILE_KEY_MISSING');
  }

  const nodeParam = url.searchParams.get('node-id') || url.searchParams.get('nodeId');
  if (!nodeParam) {
    throw new Error('FIGMA_NODE_ID_MISSING');
  }
  const { colon, dash } = normalizeNodeId(nodeParam);

  return {
    fileKey,
    nodeId: colon,
    nodeIdColon: colon,
    nodeIdDash: dash,
    originalUrl: url.toString(),
  };
}
