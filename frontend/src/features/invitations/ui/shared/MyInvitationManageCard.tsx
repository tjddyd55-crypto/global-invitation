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
import { useI18n } from '@/src/contexts/I18nContext';
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

const STATUS_LABEL_KEYS: Record<InvitationManagementStatus, string> = {
  EDITING: 'myInvitations.tab.editing',
  SHARING: 'myInvitations.tab.sharing',
  EXPIRED: 'myInvitations.tab.expired',
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
  const { t } = useI18n();
  const status = resolveInvitationManagementStatus(item);
  const title = invitationDisplayTitle(item.title, t('myInvitations.untitled'));
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
    t,
  });
  const menuItems = buildMenuItems({
    status,
    compact,
    rsvpHref,
    commentsHref,
    shareSlug: item.shareSlug,
    onCopyShare,
    onDelete,
    t,
  });

  return (
    <article className={styles.card} data-testid={`invitation-card-${item.id}`} data-status={status}>
      <div className={styles.cardMain}>
        <h2 className={styles.cardTitle}>{title}</h2>
        <div className={styles.cardMeta}>
          <span className={styles.badge}>{t(STATUS_LABEL_KEYS[status])}</span>
          <span>
            {invitationCardMeta(item, status, {
              published: t('myInvitations.meta.published'),
              updated: t('myInvitations.meta.updated'),
            })}
          </span>
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
  t: (key: string) => string;
}): MenuItem[] {
  const editLabel =
    params.status === 'EXPIRED' ? params.t('myInvitations.action.view') : params.t('myInvitations.action.edit');
  const actions: MenuItem[] = [{ label: editLabel, href: params.editorHref }];
  if (params.status === 'EDITING') {
    actions.push({
      label: params.t('myInvitations.action.delete'),
      onClick: params.onDelete,
      danger: true,
      testId: 'invitation-delete',
    });
    return actions;
  }
  if (!params.compact && params.status === 'SHARING') {
    if (params.shareSlug && params.onCopyShare) {
      actions.push({
        label: params.t('myInvitations.action.shareLink'),
        onClick: params.onCopyShare,
        testId: 'invitation-copy-share',
      });
    }
    actions.push({ label: params.t('myInvitations.action.rsvp'), href: params.rsvpHref });
    actions.push({ label: params.t('myInvitations.action.comments'), href: params.commentsHref });
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
  t: (key: string) => string;
}): MenuItem[] {
  if (params.status === 'EDITING') return [];
  const items: MenuItem[] = [];
  if (params.compact) {
    if (params.shareSlug && params.onCopyShare && params.status === 'SHARING') {
      items.push({
        label: params.t('myInvitations.action.shareLink'),
        onClick: params.onCopyShare,
        testId: 'invitation-copy-share',
      });
    }
    items.push({ label: params.t('myInvitations.action.rsvp'), href: params.rsvpHref });
    items.push({ label: params.t('myInvitations.action.comments'), href: params.commentsHref });
  }
  items.push({
    label: params.t('myInvitations.action.delete'),
    onClick: params.onDelete,
    danger: true,
    testId: 'invitation-delete',
  });
  return items;
}

function CardMenu({ items }: { items: MenuItem[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.menuWrap}>
      <button
        type="button"
        className={styles.menuButton}
        aria-label={t('myInvitations.action.more')}
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
