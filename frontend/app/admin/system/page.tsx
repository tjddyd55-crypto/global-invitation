/* eslint-disable i18next/no-literal-string */
import styles from '@/src/components/admin/AdminShell.module.css';

export default function AdminSystemPage() {
  return (
    <section className={styles.section}>
      <h1 className={styles.pageTitle}>System</h1>
      <p className={styles.pageDescription}>
        시스템 환경과 registry health를 점검하는 운영 영역입니다. 이후 env/status 진단을 확장할 수 있습니다.
      </p>
    </section>
  );
}
