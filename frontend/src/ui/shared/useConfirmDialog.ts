'use client';

import { useCallback, useState } from 'react';
import type { ConfirmDialogVariant } from './ConfirmDialog';

export type ConfirmDialogRequest = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
};

export type ConfirmDialogState = ConfirmDialogRequest & {
  open: boolean;
  busy: boolean;
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState | null>(null);

  const show = useCallback((request: ConfirmDialogRequest) => {
    setState({ ...request, open: true, busy: false });
  }, []);

  const setBusy = useCallback((busy: boolean) => {
    setState((prev) => (prev ? { ...prev, busy } : prev));
  }, []);

  const close = useCallback(() => {
    setState(null);
  }, []);

  return { state, show, setBusy, close };
}
