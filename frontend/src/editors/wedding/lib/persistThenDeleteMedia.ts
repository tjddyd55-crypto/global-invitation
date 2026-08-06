/**
 * Persist invitation draft removal, then delete remote media.
 * Persist failure → rollback. Delete failure → keep cleared (72h cleanup may reclaim).
 */

export type PersistThenDeleteStatus = 'ok' | 'persist_failed' | 'delete_failed' | 'skipped_remote';

export type PersistThenDeleteMediaParams = {
  applyDraftRemoval: () => void;
  rollbackDraft: () => void;
  persistDraft: () => Promise<void>;
  /** When omitted or false, only draft persist runs. */
  deleteRemote?: (() => Promise<void>) | null;
};

export async function persistThenDeleteMedia(
  params: PersistThenDeleteMediaParams
): Promise<PersistThenDeleteStatus> {
  params.applyDraftRemoval();
  try {
    await params.persistDraft();
  } catch {
    params.rollbackDraft();
    return 'persist_failed';
  }

  if (!params.deleteRemote) {
    return 'skipped_remote';
  }

  try {
    await params.deleteRemote();
    return 'ok';
  } catch {
    return 'delete_failed';
  }
}