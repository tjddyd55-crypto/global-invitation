'use client';

import styles from '../weddingEditor.module.css';
import type { WeddingEditorAccount } from '../state/weddingEditor.types';

type AccountListEditorProps = {
  accounts: WeddingEditorAccount[];
  onChange: (accounts: WeddingEditorAccount[]) => void;
};

function buildId() {
  return `account-${Math.random().toString(36).slice(2, 9)}`;
}

const EMPTY_ACCOUNT: Omit<WeddingEditorAccount, 'id'> = {
  role: '',
  bank: '',
  number: '',
  holder: '',
};

export default function AccountListEditor({ accounts, onChange }: AccountListEditorProps) {
  const handleAdd = () => {
    onChange([...accounts, { ...EMPTY_ACCOUNT, id: buildId() }]);
  };

  const handleRemove = (targetId: string) => {
    onChange(accounts.filter((account) => account.id !== targetId));
  };

  const handleCopy = (targetId: string) => {
    const target = accounts.find((account) => account.id === targetId);
    if (!target) return;
    onChange([...accounts, { ...target, id: buildId() }]);
  };

  const handleFieldChange = (targetId: string, key: keyof Omit<WeddingEditorAccount, 'id'>, value: string) => {
    onChange(
      accounts.map((account) => (account.id === targetId ? { ...account, [key]: value } : account))
    );
  };

  return (
    <div className={styles.accountEditor}>
      <div className={styles.accountHeaderRow}>
        <div>
          <div className={styles.sectionTitle}>계좌 목록</div>
          <div className={styles.sectionHint}>복수 계좌를 추가하고 복사할 수 있습니다.</div>
        </div>
        <button type="button" className={styles.buttonPrimary} onClick={handleAdd}>
          계좌 추가
        </button>
      </div>
      {accounts.length === 0 ? (
        <div className={styles.emptyState}>등록된 계좌가 없습니다.</div>
      ) : (
        <div className={styles.accountList}>
          {accounts.map((account) => (
            <div key={account.id} className={styles.accountCard}>
              <div className={styles.accountActions}>
                <button type="button" className={styles.buttonSubtle} onClick={() => handleCopy(account.id)}>
                  복사
                </button>
                <button type="button" className={styles.buttonDanger} onClick={() => handleRemove(account.id)}>
                  삭제
                </button>
              </div>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>구분</span>
                  <input
                    type="text"
                    value={account.role}
                    onChange={(event) => handleFieldChange(account.id, 'role', event.target.value)}
                    placeholder="신랑/신부/부모"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>은행명</span>
                  <input
                    type="text"
                    value={account.bank}
                    onChange={(event) => handleFieldChange(account.id, 'bank', event.target.value)}
                    placeholder="예: 신한은행"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>계좌번호</span>
                  <input
                    type="text"
                    value={account.number}
                    onChange={(event) => handleFieldChange(account.id, 'number', event.target.value)}
                    placeholder="숫자만 입력"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>예금주</span>
                  <input
                    type="text"
                    value={account.holder}
                    onChange={(event) => handleFieldChange(account.id, 'holder', event.target.value)}
                    placeholder="예: 홍길동"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
