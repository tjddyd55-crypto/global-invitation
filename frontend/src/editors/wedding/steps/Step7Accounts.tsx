'use client';

import AccountListEditor from '../components/AccountListEditor';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorAccount } from '../state/weddingEditor.types';
import { getConceptPresentationConfig } from '@/src/invitation/conceptPresentationConfig';

type Step7AccountsProps = {
  accounts: WeddingEditorAccount[];
  onChange: (accounts: WeddingEditorAccount[]) => void;
  conceptType: 'WEDDING' | 'FUNERAL' | 'GENERAL';
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
  const config = getConceptPresentationConfig(conceptType);
  const isOptional = config.accountOptional;
  const showForm = !isOptional || accountEnabled;

  return (
    <section className={styles.stepSection} data-testid="step-accounts">
      <div className={styles.sectionHeader}>
        <h2>{conceptType === 'GENERAL' ? '참가비·계좌 정보' : '계좌 정보'}</h2>
        <p>
          {conceptType === 'GENERAL'
            ? '참가비, 회비, 등록비 또는 후원금을 받을 계좌를 안내할 수 있습니다.'
            : '복수 계좌 추가/삭제/복제 기능을 제공합니다.'}
        </p>
      </div>

      {isOptional ? (
        <div className={styles.accountToggleBlock} data-testid="account-enabled-toggle">
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={accountEnabled}
              onChange={(event) => onAccountEnabledChange(event.target.checked)}
            />
            <span>참가비·계좌 정보 사용</span>
          </label>
          <p className={styles.sectionHint}>
            공개하면 초대장 방문자가 계좌 정보를 볼 수 있습니다. OFF해도 입력한 계좌 데이터는 유지됩니다.
          </p>
        </div>
      ) : null}

      {showForm ? (
        <>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>섹션 제목</span>
            <input
              type="text"
              value={accountsTitle}
              onChange={(event) => onAccountsTitleChange(event.target.value)}
              placeholder={config.accountsTitle}
              data-testid="accounts-title-input"
            />
          </label>
          <AccountListEditor accounts={accounts} onChange={onChange} conceptType={conceptType} />
        </>
      ) : null}
    </section>
  );
}
