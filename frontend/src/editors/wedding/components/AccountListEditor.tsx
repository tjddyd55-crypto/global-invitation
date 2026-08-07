'use client';

import styles from '../weddingEditor.module.css';
import type { WeddingEditorAccount } from '../state/weddingEditor.types';

type AccountListEditorProps = {
  accounts: WeddingEditorAccount[];
  onChange: (accounts: WeddingEditorAccount[]) => void;
  /** GENERAL/ORGANIZATION: 용도 placeholder 등 */
  conceptType?: 'WEDDING' | 'FUNERAL' | 'GENERAL' | 'ORGANIZATION';
};

function buildId() {
  return `account-${Math.random().toString(36).slice(2, 9)}`;
}

const EMPTY_ACCOUNT: Omit<WeddingEditorAccount, 'id'> = {
  role: '',
  bank: '',
  number: '',
  holder: '',
  iban: '',
  swiftBic: '',
  routingCode: '',
  paymentNote: '',
};

const GENERAL_ROLE_HINTS = ['참가비', '등록비', '회비', '후원금', '기부금', '기타'];

export default function AccountListEditor({
  accounts,
  onChange,
  conceptType = 'WEDDING',
}: AccountListEditorProps) {
  const isGeneral = conceptType === 'GENERAL' || conceptType === 'ORGANIZATION';

  const handleAdd = () => {
    onChange([
      ...accounts,
      {
        ...EMPTY_ACCOUNT,
        id: buildId(),
        role: isGeneral ? '참가비' : '',
      },
    ]);
  };

  const handleRemove = (targetId: string) => {
    onChange(accounts.filter((account) => account.id !== targetId));
  };

  const handleCopy = (targetId: string) => {
    const target = accounts.find((account) => account.id === targetId);
    if (!target) return;
    onChange([...accounts, { ...target, id: buildId() }]);
  };

  const handleFieldChange = (
    targetId: string,
    key: keyof Omit<WeddingEditorAccount, 'id'>,
    value: string
  ) => {
    onChange(
      accounts.map((account) => (account.id === targetId ? { ...account, [key]: value } : account))
    );
  };

  return (
    <div className={styles.accountEditor}>
      <div className={styles.accountHeaderRow}>
        <div>
          <div className={styles.sectionTitle}>계좌 목록</div>
          <div className={styles.sectionHint}>
            {isGeneral
              ? '참가비·회비·후원금 등 복수 계좌를 추가할 수 있습니다. 계좌번호는 문자열로 저장됩니다.'
              : '복수 계좌를 추가하고 복사할 수 있습니다.'}
          </div>
        </div>
        <button type="button" className={styles.buttonPrimary} onClick={handleAdd}>
          계좌 추가
        </button>
      </div>
      {accounts.length === 0 ? (
        <div className={styles.emptyState}>계좌 정보를 1개 이상 추가해 주세요.</div>
      ) : (
        <div className={styles.accountList}>
          {accounts.map((account) => (
            <div key={account.id} className={styles.accountCard}>
              <div className={styles.accountActions}>
                <button type="button" className={styles.buttonSubtle} onClick={() => handleCopy(account.id)}>
                  항목 복제
                </button>
                <button type="button" className={styles.buttonDanger} onClick={() => handleRemove(account.id)}>
                  삭제
                </button>
              </div>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{isGeneral ? '용도' : '구분'}</span>
                  <input
                    type="text"
                    value={account.role}
                    list={isGeneral ? `account-role-hints-${account.id}` : undefined}
                    onChange={(event) => handleFieldChange(account.id, 'role', event.target.value)}
                    placeholder={isGeneral ? '예: 참가비' : '신랑/신부/부모'}
                  />
                  {isGeneral ? (
                    <datalist id={`account-role-hints-${account.id}`}>
                      {GENERAL_ROLE_HINTS.map((hint) => (
                        <option key={hint} value={hint} />
                      ))}
                    </datalist>
                  ) : null}
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>은행/금융기관</span>
                  <input
                    type="text"
                    value={account.bank}
                    onChange={(event) => handleFieldChange(account.id, 'bank', event.target.value)}
                    placeholder="예: 국민은행 / Chase / HSBC"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>계좌번호</span>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    value={account.number}
                    onChange={(event) => handleFieldChange(account.id, 'number', event.target.value)}
                    placeholder="하이픈·영문 포함 가능"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>예금주/수취인</span>
                  <input
                    type="text"
                    value={account.holder}
                    onChange={(event) => handleFieldChange(account.id, 'holder', event.target.value)}
                    placeholder="예: 홍길동"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>입금 안내 (선택)</span>
                  <input
                    type="text"
                    value={account.paymentNote ?? ''}
                    onChange={(event) => handleFieldChange(account.id, 'paymentNote', event.target.value)}
                    placeholder={
                      isGeneral ? '입금자명은 참석자 이름으로 입력해 주세요.' : '선택 안내 문구'
                    }
                  />
                </label>
              </div>
              <details className={styles.accountAdvanced}>
                <summary>추가 정보 (IBAN / SWIFT / Routing)</summary>
                <div className={styles.fieldGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>IBAN</span>
                    <input
                      type="text"
                      value={account.iban ?? ''}
                      onChange={(event) => handleFieldChange(account.id, 'iban', event.target.value)}
                      placeholder="예: GB29 NWBK 6016 1331 9268 19"
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>SWIFT/BIC</span>
                    <input
                      type="text"
                      value={account.swiftBic ?? ''}
                      onChange={(event) => handleFieldChange(account.id, 'swiftBic', event.target.value)}
                      placeholder="예: CHASUS33"
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Routing / Sort Code</span>
                    <input
                      type="text"
                      value={account.routingCode ?? ''}
                      onChange={(event) => handleFieldChange(account.id, 'routingCode', event.target.value)}
                      placeholder="예: 021000021"
                    />
                  </label>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
