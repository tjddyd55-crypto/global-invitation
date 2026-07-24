'use client';

import { useCallback, useEffect, useState } from 'react';
import { listMyInvitations, type InvitationSummary } from '@/src/lib/api';
import { fetchCurrentUser } from '@/src/shared/auth';

export type InvitationsLoadStatus = 'loading' | 'ready' | 'empty' | 'error';

export interface UseMyInvitationsResult {
  items: InvitationSummary[];
  guestToken: string | null;
  status: InvitationsLoadStatus;
  reload: () => Promise<void>;
}

/**
 * 인증된 사용자의 초대장 목록만 조회한다.
 * - 신규 작성자 플로우에서 guestToken 목록은 사용하지 않는다.
 */
export function useMyInvitations(): UseMyInvitationsResult {
  const [items, setItems] = useState<InvitationSummary[]>([]);
  const [status, setStatus] = useState<InvitationsLoadStatus>('loading');

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const user = await fetchCurrentUser({ useCache: true });
      if (!user) {
        setItems([]);
        setStatus('empty');
        return;
      }
      const loaded = await listMyInvitations();
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

  return { items, guestToken: null, status, reload };
}
