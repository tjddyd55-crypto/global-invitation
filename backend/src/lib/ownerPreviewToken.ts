import crypto from 'crypto';

const TOKEN_TTL_MS = 15 * 60 * 1000;

export type OwnerPreviewPayload = {
  invitationId: string;
  userId: string;
  exp: number;
};

function getSecret(): string {
  const secret =
    process.env.OWNER_PREVIEW_TOKEN_SECRET?.trim() ||
    process.env.ADMIN_JWT_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error('OWNER_PREVIEW_TOKEN_SECRET must be configured');
  }
  return secret;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

export function createOwnerPreviewToken(invitationId: string, userId: string): string {
  const payload: OwnerPreviewPayload = {
    invitationId,
    userId,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', getSecret()).update(payloadPart).digest();
  return `${payloadPart}.${base64UrlEncode(signature)}`;
}

export function verifyOwnerPreviewToken(token: string): OwnerPreviewPayload | null {
  const trimmed = token.trim();
  const [payloadPart, signaturePart] = trimmed.split('.');
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expected = crypto.createHmac('sha256', getSecret()).update(payloadPart).digest();
  const actual = base64UrlDecode(signaturePart);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart).toString('utf8')) as OwnerPreviewPayload;
    if (!payload.invitationId || !payload.userId || typeof payload.exp !== 'number') {
      return null;
    }
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
