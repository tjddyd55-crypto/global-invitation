'use client';

import Link from 'next/link';
import styles from './DevHub.module.css';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link href="/" className={styles.homeLink}>← Home</Link>
        <Link href="/dev" className={styles.devLink}>Dev Hub</Link>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
