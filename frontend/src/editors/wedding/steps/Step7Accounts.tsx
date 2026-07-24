'use client';

import AccountListEditor from '../components/AccountListEditor';
import styles from '../weddingEditor.module.css';
import type { WeddingEditorAccount } from '../state/weddingEditor.types';

type Step7AccountsProps = {
  accounts: WeddingEditorAccount[];
  onChange: (accounts: WeddingEditorAccount[]) => void;
};

export default function Step7Accounts({ accounts, onChange }: Step7AccountsProps) {
  return (
    <section className={styles.stepSection}>
      <div className={styles.sectionHeader}>
        <h2>계좌 정보</h2>
        <p>복수 계좌 추가/삭제/복사 기능을 제공합니다.</p>
      </div>
      <AccountListEditor accounts={accounts} onChange={onChange} />
    </section>
  );
}
