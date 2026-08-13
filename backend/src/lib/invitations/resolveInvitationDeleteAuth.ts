export type InvitationDeleteAuthResult = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'OK';

export function resolveInvitationDeleteAuth(params: {
  userId?: string;
  guestToken?: string | null;
  invitation: { userId: string | null; guestToken: string | null };
}): InvitationDeleteAuthResult {
  const hasActor = Boolean(params.userId) || Boolean(params.guestToken);
  if (!hasActor) return 'UNAUTHENTICATED';

  if (params.invitation.userId) {
    return params.userId === params.invitation.userId ? 'OK' : 'FORBIDDEN';
  }

  if (
    params.invitation.guestToken &&
    params.guestToken &&
    params.invitation.guestToken === params.guestToken
  ) {
    return 'OK';
  }

  return 'FORBIDDEN';
}
