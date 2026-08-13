'use client';
/* eslint-disable i18next/no-literal-string */

import { useCallback, useState } from 'react';
import { deleteInvitation, type InvitationSummary } from '@/src/shared/api';

export function useInvitationDeleteFlow(removeItem: (invitationId: string) => void) {
  const [pendingDelete, setPendingDelete] = useState<InvitationSummary | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const requestDelete = useCallback((item: InvitationSummary) => {
    setDeleteError(null);
    setPendingDelete(item);
  }, []);

  const cancelDelete = useCallback(() => {
    if (deleteBusy) return;
    setPendingDelete(null);
  }, [deleteBusy]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteInvitation(pendingDelete.id);
      removeItem(pendingDelete.id);
      setNotice('초대장을 삭제했습니다.');
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(resolveDeleteErrorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteBusy, pendingDelete, removeItem]);

  return {
    pendingDelete,
    deleteBusy,
    deleteError,
    notice,
    setNotice,
    setDeleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}

function resolveDeleteErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'Unauthorized') {
    return '로그인이 필요합니다.';
  }
  return '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
