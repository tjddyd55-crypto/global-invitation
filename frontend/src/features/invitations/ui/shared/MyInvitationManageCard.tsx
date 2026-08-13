'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import Link from 'next/link';
import type { InvitationSummary } from '@/src/shared/api';
import {
  invitationCardMeta,
  invitationDisplayTitle,
  resolveInvitationManagementStatus,
  type InvitationManagementStatus,
} from '@/src/features/invitations/model/invitationManagementStatus';
import styles from './MyInvitationsWorkspace.module.css';

type MenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  testId?: string;
};

type MyInvitationManageCardProps = {
  item: InvitationSummary;
  layout: 'desktop' | 'mobile';
  editorHref: string;
  rsvpHref: string;
  commentsHref: string;
  onDelete: () => void;
  onCopyShare?: () => void;
};

const STATUS_LABEL: Record<InvitationManagementStatus, string> = {
  EDITING: '수정중',
  SHARING: '공유중',
  EXPIRED: '기간종료',
};

export default function MyInvitationManageCard({
  item,
  layout,
  editorHref,
  rsvpHref,
  commentsHref,
  onDelete,
  onCopyShare,
}: MyInvitationManageCardProps) {
  const status = resolveInvitationManagementStatus(item);
  const title = invitationDisplayTitle(item.title);
  const compact = layout === 'mobile' && status !== 'EDITING';
  const inlineActions = buildInlineActions({
    status,
    compact,
    editorHref,
    rsvpHref,
    commentsHref,
    shareSlug: item.shareSlug,
    onCopyShare,
    onDelete,
  });
  const menuItems = buildMenuItems({
    status,
    compact,
    rsvpHref,
    commentsHref,
    shareSlug: item.shareSlug,
    onCopyShare,
    onDelete,
  });

  return (
    <article className={styles.card} data-testid={`invitation-card-${item.id}`} data-status={status}>
      <div className={styles.cardMain}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <div className={styles.cardMeta}>
          <span className={styles.badge}>{STATUS_LABEL[status]}</span>
          <span>{invitationCardMeta(item, status)}</span>
        </div>
      </div>
      <div className={styles.cardActions}>
        {inlineActions.map((action) =>
          action.href ? (
            <Link key={action.label} href={action.href} className={styles.actionLink}>
              {action.label}
            </Link>
          ) : (
            <button
              key={action.label}
              type="button"
              className={action.danger ? styles.actionDanger : styles.actionButton}
              onClick={action.onClick}
              data-testid={action.testId}
            >
              {action.label}
            </button>
          )
        )}
        {menuItems.length > 0 ? <CardMenu items={menuItems} /> : null}
      </div>
    </article>
  );
}

function buildInlineActions(params: {
  status: InvitationManagementStatus;
  compact: boolean;
  editorHref: string;
  rsvpHref: string;
  commentsHref: string;
  shareSlug?: string | null;
  onCopyShare?: () => void;
  onDelete: () => void;
}): MenuItem[] {
  const editLabel = params.status === 'EXPIRED' ? '보기' : '수정';
  const actions: MenuItem[] = [{ label: editLabel, href: params.editorHref }];
  if (params.status === 'EDITING') {
    actions.push({ label: '삭제', onClick: params.onDelete, danger: true, testId: 'invitation-delete' });
    return actions;
  }
  if (!params.compact && params.status === 'SHARING') {
    if (params.shareSlug && params.onCopyShare) {
      actions.push({ label: '공유 링크', onClick: params.onCopyShare, testId: 'invitation-copy-share' });
    }
    actions.push({ label: '참석 관리', href: params.rsvpHref });
    actions.push({ label: '댓글 관리', href: params.commentsHref });
  }
  return actions;
}

function buildMenuItems(params: {
  status: InvitationManagementStatus;
  compact: boolean;
  rsvpHref: string;
  commentsHref: string;
  shareSlug?: string | null;
  onCopyShare?: () => void;
  onDelete: () => void;
}): MenuItem[] {
  if (params.status === 'EDITING') return [];
  const items: MenuItem[] = [];
  if (params.compact) {
    if (params.shareSlug && params.onCopyShare && params.status === 'SHARING') {
      items.push({ label: '공유 링크', onClick: params.onCopyShare, testId: 'invitation-copy-share' });
    }
    items.push({ label: '참석 관리', href: params.rsvpHref });
    items.push({ label: '댓글 관리', href: params.commentsHref });
  }
  items.push({ label: '삭제', onClick: params.onDelete, danger: true, testId: 'invitation-delete' });
  return items;
}

function CardMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.menuWrap}>
      <button
        type="button"
        className={styles.menuButton}
        aria-label="더보기"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        data-testid="invitation-card-menu"
      >
        ⋯
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                className={styles.menuItem}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={item.danger ? `${styles.menuItem} ${styles.menuDanger}` : styles.menuItem}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                data-testid={item.testId}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
