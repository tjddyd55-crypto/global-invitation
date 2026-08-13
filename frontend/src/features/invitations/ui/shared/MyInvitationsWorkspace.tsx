'use client';
/* eslint-disable i18next/no-literal-string */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { InvitationSummary } from '@/src/shared/api';
import { useMyInvitations } from '@/src/features/invitations/model/useMyInvitations';
import { useInvitationDeleteFlow } from '@/src/features/invitations/model/useInvitationDeleteFlow';
import {
  countInvitationsByManagementStatus,
  groupInvitationsByManagementStatus,
  invitationDisplayTitle,
  type InvitationManagementStatus,
} from '@/src/features/invitations/model/invitationManagementStatus';
import ConfirmDialog from '@/src/ui/shared/ConfirmDialog';
import MyInvitationsStatusTabs from './MyInvitationsStatusTabs';
import MyInvitationManageCard from './MyInvitationManageCard';
import styles from './MyInvitationsWorkspace.module.css';

type MyInvitationsWorkspaceProps = {
  layout: 'desktop' | 'mobile';
  createHref: string;
  editorHrefFor?: (id: string) => string;
  rsvpHrefFor?: (id: string) => string;
  commentsHrefFor?: (id: string) => string;
};

const EMPTY_COPY: Record<InvitationManagementStatus, { title: string; hint?: string; showCreate?: boolean }> = {
  EDITING: {
    title: '수정 중인 초대장이 없습니다.',
    hint: '새 초대장을 만들어 보세요.',
    showCreate: true,
  },
  SHARING: { title: '현재 공유 중인 초대장이 없습니다.' },
  EXPIRED: { title: '기간이 종료된 초대장이 없습니다.' },
};

export default function MyInvitationsWorkspace({
  layout,
  createHref,
  editorHrefFor = (id) => `/editor/${id}`,
  rsvpHrefFor = (id) => `/my-invitations/${id}/rsvp`,
  commentsHrefFor = (id) => `/my-invitations/${id}/comments`,
}: MyInvitationsWorkspaceProps) {
  const { items, status, reload, removeItem } = useMyInvitations();
  const [tab, setTab] = useState<InvitationManagementStatus>('EDITING');
  const deleteFlow = useInvitationDeleteFlow(removeItem);
  const groups = useMemo(() => groupInvitationsByManagementStatus(items), [items]);
  const counts = useMemo(() => countInvitationsByManagementStatus(items), [items]);

  return (
    <section className={styles.screen} data-layout={layout} data-testid="my-invitations-workspace">
      <header className={styles.header}>
        <h1>내 초대장</h1>
        <Link href={createHref} className={styles.newButton} data-testid="create-invitation">
          ＋ 새로 만들기
        </Link>
      </header>
      {status === 'loading' && (
        <>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </>
      )}
      {status === 'error' && (
        <div className={styles.errorBox}>
          목록을 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.
          <button type="button" className={styles.retryButton} onClick={() => void reload()}>
            다시 시도
          </button>
        </div>
      )}
      {status === 'ready' && (
        <ReadyList
          layout={layout}
          tab={tab}
          counts={counts}
          items={groups[tab]}
          createHref={createHref}
          notice={deleteFlow.notice}
          deleteError={deleteFlow.deleteError}
          editorHrefFor={editorHrefFor}
          rsvpHrefFor={rsvpHrefFor}
          commentsHrefFor={commentsHrefFor}
          onSelectTab={setTab}
          onDelete={deleteFlow.requestDelete}
          onCopyShare={(item) => {
            void copyShareLink(item.shareSlug, deleteFlow.setNotice, deleteFlow.setDeleteError);
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteFlow.pendingDelete)}
        busy={deleteFlow.deleteBusy}
        title={`‘${invitationDisplayTitle(deleteFlow.pendingDelete?.title)}’ 초대장을 삭제할까요?`}
        description="삭제한 초대장은 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        testId="invitation-delete-dialog"
        onCancel={deleteFlow.cancelDelete}
        onConfirm={() => void deleteFlow.confirmDelete()}
      />
    </section>
  );
}

function ReadyList(props: {
  layout: 'desktop' | 'mobile';
  tab: InvitationManagementStatus;
  counts: ReturnType<typeof countInvitationsByManagementStatus>;
  items: InvitationSummary[];
  createHref: string;
  notice: string | null;
  deleteError: string | null;
  editorHrefFor: (id: string) => string;
  rsvpHrefFor: (id: string) => string;
  commentsHrefFor: (id: string) => string;
  onSelectTab: (status: InvitationManagementStatus) => void;
  onDelete: (item: InvitationSummary) => void;
  onCopyShare: (item: InvitationSummary) => void;
}) {
  return (
    <>
      <MyInvitationsStatusTabs selected={props.tab} counts={props.counts} onSelect={props.onSelectTab} />
      {props.notice ? (
        <p className={styles.notice} role="status">
          {props.notice}
        </p>
      ) : null}
      {props.deleteError ? <p className={styles.deleteError}>{props.deleteError}</p> : null}
      <div id="invitation-tab-panel" role="tabpanel" aria-labelledby={`invitation-tab-${props.tab}`}>
        {props.items.length === 0 ? (
          <TabEmptyState status={props.tab} createHref={props.createHref} />
        ) : (
          <div className={styles.cardList}>
            {props.items.map((item) => (
              <MyInvitationManageCard
                key={item.id}
                item={item}
                layout={props.layout}
                editorHref={props.editorHrefFor(item.id)}
                rsvpHref={props.rsvpHrefFor(item.id)}
                commentsHref={props.commentsHrefFor(item.id)}
                onDelete={() => props.onDelete(item)}
                onCopyShare={item.shareSlug ? () => props.onCopyShare(item) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function TabEmptyState({
  status,
  createHref,
}: {
  status: InvitationManagementStatus;
  createHref: string;
}) {
  const copy = EMPTY_COPY[status];
  return (
    <div className={styles.emptyBox} data-testid={`invitation-empty-${status.toLowerCase()}`}>
      <p>{copy.title}</p>
      {copy.hint ? <p className={styles.emptyHint}>{copy.hint}</p> : null}
      {copy.showCreate ? (
        <Link href={createHref} className={styles.emptyCta}>
          ＋ 새로 만들기
        </Link>
      ) : null}
    </div>
  );
}

async function copyShareLink(
  shareSlug: string | null | undefined,
  setNotice: (value: string | null) => void,
  setError: (value: string | null) => void
) {
  if (!shareSlug || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    setError('공유 링크를 복사하지 못했습니다.');
    return;
  }
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/i/${shareSlug}`);
    setError(null);
    setNotice('공유 링크를 복사했습니다.');
  } catch {
    setError('공유 링크를 복사하지 못했습니다.');
  }
}
