'use client';

import { useCallback, useEffect, useState } from 'react';
import { listGuestInvitations, listMyInvitations, type InvitationSummary } from '@/src/lib/api';
import { getGuestToken, getStoredSession } from '@/src/lib/auth';

export type InvitationsLoadStatus = 'loading' | 'ready' | 'empty' | 'error';

export interface UseMyInvitationsResult {
  items: InvitationSummary[];
  guestToken: string | null;
  status: InvitationsLoadStatus;
  reload: () => Promise<void>;
}

/**
 * 로그인 세션 또는 게스트 토큰을 기준으로 내 초대장 목록을 조회한다.
 * - 세션 > 게스트 토큰 순서로 우선.
 * - 네트워크 에러는 'error' 상태로 구분하여 UI 에서 재시도 UX 를 붙일 수 있게 한다.
 */
export function useMyInvitations(): UseMyInvitationsResult {
  const [items, setItems] = useState<InvitationSummary[]>([]);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [status, setStatus] = useState<InvitationsLoadStatus>('loading');

  const reload = useCallback(async () => {
    const token = getGuestToken();
    setGuestToken(token);
    setStatus('loading');
    try {
      const session = getStoredSession();
      let loaded: InvitationSummary[] = [];
      if (session?.token) {
        loaded = await listMyInvitations();
      } else if (token) {
        loaded = await listGuestInvitations(token);
      }
      setItems(loaded);
      setStatus(loaded.length === 0 ? 'empty' : 'ready');
    } catch {
      setItems([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, guestToken, status, reload };
}
