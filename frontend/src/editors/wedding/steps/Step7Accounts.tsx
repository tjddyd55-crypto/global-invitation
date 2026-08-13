'use client';
/* eslint-disable i18next/no-literal-string */

import AccountListEditor from '../components/AccountListEditor';
import { useInvitationT } from '@/src/i18n/InvitationLocaleContext';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorAccount } from '../state/weddingEditor.types';
import { getConceptPresentationConfig } from '@/src/invitation/conceptPresentationConfig';

type Step7AccountsProps = {
  accounts: WeddingEditorAccount[];
  onChange: (accounts: WeddingEditorAccount[]) => void;
  conceptType: 'WEDDING' | 'FUNERAL' | 'GENERAL' | 'ORGANIZATION';
  accountEnabled: boolean;
  accountsTitle: string;
  onAccountEnabledChange: (enabled: boolean) => void;
  onAccountsTitleChange: (title: string) => void;
};

export default function Step7Accounts({
  accounts,
  onChange,
  conceptType,
  accountEnabled,
  accountsTitle,
  onAccountEnabledChange,
  onAccountsTitleChange,
}: Step7AccountsProps) {
  const { t } = useInvitationT();
  const config = getConceptPresentationConfig(conceptType);
  const isOptional = config.accountOptional;
  const showForm = !isOptional || accountEnabled;
  const isEventLike = conceptType === 'GENERAL' || conceptType === 'ORGANIZATION';

  return (
    <section className={styles.stepSection} data-testid="step-accounts">
      <div className={styles.sectionHeader}>
        <h2>{isEventLike ? t('editor.accounts.headingFee') : t('editor.accounts.heading')}</h2>
        <p>{isEventLike ? t('editor.accounts.descFee') : t('editor.accounts.desc')}</p>
      </div>

      {isOptional ? (
        <div className={styles.accountToggleBlock} data-testid="account-enabled-toggle">
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={accountEnabled}
              onChange={(event) => onAccountEnabledChange(event.target.checked)}
            />
            <span>{t('editor.accounts.headingFee')}</span>
          </label>
          <p className={styles.sectionHint}>
            {t('editor.accounts.visibilityHint')}
          </p>
        </div>
      ) : null}

      {showForm ? (
        <>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>{t('editor.accounts.sectionTitle')}</span>
            <input
              type="text"
              value={accountsTitle}
              onChange={(event) => onAccountsTitleChange(event.target.value)}
              placeholder={t(isEventLike ? 'invitation.accounts.fee' : 'invitation.accounts.gift')}
              data-testid="accounts-title-input"
            />
          </label>
          <AccountListEditor accounts={accounts} onChange={onChange} conceptType={conceptType} />
        </>
      ) : null}
    </section>
  );
}
