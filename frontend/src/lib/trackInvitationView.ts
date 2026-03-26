'use client';

import { buildApiUrl, buildRequestInit } from '@/src/lib/apiBase';

const INVITATION_ANALYTICS_SESSION_KEY = 'global_invitation_analytics_session_id';

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getInvitationAnalyticsSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const existing = window.localStorage.getItem(INVITATION_ANALYTICS_SESSION_KEY);
    if (existing?.trim()) {
      return existing;
    }

    const created = createSessionId();
    window.localStorage.setItem(INVITATION_ANALYTICS_SESSION_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function trackInvitationView(slug: string) {
  if (typeof window === 'undefined' || !slug.trim()) {
    return;
  }

  const sessionId = getInvitationAnalyticsSessionId();

  void fetch(
    buildApiUrl(`/api/invitations/${encodeURIComponent(slug)}/view`),
    buildRequestInit({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
      }),
      keepalive: true,
    })
  ).catch(() => {
    // Analytics failures must never affect invitation rendering.
  });
}
