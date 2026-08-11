import prisma from './prisma';

export function normalizeAccessText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveGuestTokenFromRequest(req: {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}): string | null {
  const tokenCandidates = [
    normalizeAccessText(req.body?.guestToken),
    normalizeAccessText(req.body?.guest_token),
    normalizeAccessText(req.query?.token),
    normalizeAccessText(req.query?.guestToken),
    normalizeAccessText(req.query?.guest_token),
    typeof req.headers?.['x-guest-token'] === 'string' ? req.headers['x-guest-token'].trim() : '',
  ].filter(Boolean);

  return tokenCandidates[0] || null;
}

export async function canEditInvitation(params: {
  invitation: { userId: string | null; guestToken: string | null };
  userId?: string;
  guestToken?: string | null;
}): Promise<boolean> {
  if (params.invitation.userId) {
    return Boolean(params.userId && params.invitation.userId === params.userId);
  }
  return Boolean(
    params.invitation.guestToken &&
      params.guestToken &&
      params.invitation.guestToken === params.guestToken
  );
}

export async function claimGuestInvitationIfNeeded(params: {
  invitation: { id: string; userId: string | null; guestToken: string | null };
  userId?: string;
  guestToken?: string | null;
}): Promise<void> {
  if (!params.userId) return;
  if (params.invitation.userId) return;
  if (!params.invitation.guestToken) return;
  if (!params.guestToken || params.guestToken !== params.invitation.guestToken) return;

  await prisma.invitation.update({
    where: { id: params.invitation.id },
    data: {
      userId: params.userId,
      guestToken: null,
      ownerType: 'USER',
      ownerId: params.userId,
    },
  });
}
