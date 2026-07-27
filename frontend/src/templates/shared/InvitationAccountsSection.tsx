'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import {
  getInvitationAccountItems,
  isAccountItemComplete,
  resolveAccountsSectionTitle,
  type InvitationAccountItem,
} from '@/src/invitation/accountItems';
import type { InvitationConceptType } from '@/src/invitation/conceptPresentationConfig';
import styles from './InvitationAccountsSection.module.css';

type InvitationAccountsSectionProps = {
  accounts: unknown;
  conceptType: InvitationConceptType | string | null | undefined;
  accountsTitle?: string;
  className?: string;
};

async function copyText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function AccountCard({
  account,
  onCopied,
}: {
  account: InvitationAccountItem;
  onCopied: () => void;
}) {
  return (
    <div className={styles.accountCard} data-testid="account-card">
      <div className={styles.accountHeader}>
        <strong>{account.label || '계좌'}</strong>
        {account.accountNumber ? (
          <button
            className={styles.copyButton}
            type="button"
            data-testid="account-copy"
            onClick={async () => {
              const ok = await copyText(account.accountNumber);
              if (ok) onCopied();
            }}
          >
            복사
          </button>
        ) : null}
      </div>
      {account.financialInstitution ? (
        <div className={styles.line}>{account.financialInstitution}</div>
      ) : null}
      {account.accountNumber ? (
        <div className={styles.accountNumber}>{account.accountNumber}</div>
      ) : null}
      {account.accountHolder ? <div className={styles.line}>{account.accountHolder}</div> : null}
      {account.iban ? <div className={styles.meta}>IBAN {account.iban}</div> : null}
      {account.swiftBic ? <div className={styles.meta}>SWIFT/BIC {account.swiftBic}</div> : null}
      {account.routingCode ? (
        <div className={styles.meta}>Routing/Sort {account.routingCode}</div>
      ) : null}
      {account.paymentNote ? <p className={styles.note}>{account.paymentNote}</p> : null}
    </div>
  );
}

export default function InvitationAccountsSection({
  accounts,
  conceptType,
  accountsTitle,
  className,
}: InvitationAccountsSectionProps) {
  const [toast, setToast] = useState<string | null>(null);
  const items = getInvitationAccountItems(accounts).filter(isAccountItemComplete);
  if (items.length === 0) return null;

  const title =
    (typeof accountsTitle === 'string' && accountsTitle.trim()) ||
    resolveAccountsSectionTitle({ accountsTitle }, conceptType);

  return (
    <section
      className={`${styles.section} ${className ?? ''}`.trim()}
      data-testid="invitation-accounts"
      data-concept={conceptType ?? ''}
    >
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.list}>
        {items.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onCopied={() => {
              setToast('계좌번호가 복사되었습니다');
              window.setTimeout(() => setToast(null), 1800);
            }}
          />
        ))}
      </div>
      {toast ? (
        <div className={styles.toast} role="status" data-testid="account-copy-toast">
          {toast}
        </div>
      ) : null}
    </section>
  );
}
