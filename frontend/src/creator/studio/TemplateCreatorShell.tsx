'use client';

import styles from './TemplateCreatorStudio.module.css';

type TemplateCreatorShellProps = {
  title: string;
  description: string;
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  headerActions?: React.ReactNode;
  notice?: React.ReactNode;
};

export default function TemplateCreatorShell({
  title,
  description,
  left,
  center,
  right,
  headerActions,
  notice,
}: TemplateCreatorShellProps) {
  return (
    <div className={styles.studioPage}>
      <header className={styles.studioHeader}>
        <div>
          <h1 className={styles.studioTitle}>{title}</h1>
          <p className={styles.studioDescription}>{description}</p>
          {notice}
        </div>
        {headerActions}
      </header>
      <div className={styles.layout}>
        <aside className={styles.stack}>{left}</aside>
        <main className={styles.stack}>{center}</main>
        <aside className={styles.stack}>{right}</aside>
      </div>
    </div>
  );
}
