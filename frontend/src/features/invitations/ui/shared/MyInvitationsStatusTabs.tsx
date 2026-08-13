'use client';
/* eslint-disable i18next/no-literal-string */

import type { KeyboardEvent } from 'react';
import {
  INVITATION_MANAGEMENT_TABS,
  type InvitationManagementCounts,
  type InvitationManagementStatus,
} from '@/src/features/invitations/model/invitationManagementStatus';
import { useI18n } from '@/src/contexts/I18nContext';
import styles from './MyInvitationsWorkspace.module.css';

type MyInvitationsStatusTabsProps = {
  selected: InvitationManagementStatus;
  counts: InvitationManagementCounts;
  onSelect: (status: InvitationManagementStatus) => void;
};

export default function MyInvitationsStatusTabs({
  selected,
  counts,
  onSelect,
}: MyInvitationsStatusTabsProps) {
  const { t } = useI18n();
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = INVITATION_MANAGEMENT_TABS.findIndex((tab) => tab.id === selected);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const next = INVITATION_MANAGEMENT_TABS[(currentIndex + 1) % INVITATION_MANAGEMENT_TABS.length];
      if (next) onSelect(next.id);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prev =
        INVITATION_MANAGEMENT_TABS[
          (currentIndex - 1 + INVITATION_MANAGEMENT_TABS.length) % INVITATION_MANAGEMENT_TABS.length
        ];
      if (prev) onSelect(prev.id);
    }
  };

  return (
    <div
      className={styles.tabList}
      role="tablist"
      aria-label={t('myInvitations.aria.tabs')}
      onKeyDown={handleKeyDown}
      data-testid="invitation-status-tabs"
    >
      {INVITATION_MANAGEMENT_TABS.map((tab) => {
        const isSelected = tab.id === selected;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`invitation-tab-${tab.id}`}
            aria-selected={isSelected}
            aria-controls="invitation-tab-panel"
            tabIndex={isSelected ? 0 : -1}
            className={isSelected ? `${styles.tab} ${styles.tabSelected}` : styles.tab}
            onClick={() => onSelect(tab.id)}
            data-testid={`invitation-tab-${tab.id.toLowerCase()}`}
            data-count={counts[tab.id]}
          >
            <span>{t(tab.labelKey)}</span>
            <span className={styles.tabCount}>{counts[tab.id]}</span>
          </button>
        );
      })}
    </div>
  );
}
