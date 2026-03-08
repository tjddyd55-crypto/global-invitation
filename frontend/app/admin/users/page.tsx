/* eslint-disable i18next/no-literal-string */
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminUsersPage() {
  return (
    <section className={styles.section}>
      <h1 className={styles.pageTitle}>Users</h1>
      <p className={styles.pageDescription}>
        사용자/제작자 관리 영역입니다. 다음 단계에서 승인, 역할, 활동 로그를 연결할 수 있습니다.
      </p>
    </section>
  );
}
