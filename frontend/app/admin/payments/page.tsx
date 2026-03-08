/* eslint-disable i18next/no-literal-string */
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminPaymentsPage() {
  return (
    <section className={styles.section}>
      <h1 className={styles.pageTitle}>Payments</h1>
      <p className={styles.pageDescription}>
        결제/정산 관리 영역입니다. 이후 creator payout, settlement history를 연결할 수 있습니다.
      </p>
    </section>
  );
}
