'use client';

import styles from './IntegrityCard.module.css';

export type ItemStatus = 'ok' | 'warning' | 'error';

export type IntegrityItem = {
  text: string;
  status: ItemStatus;
};

type IntegrityCardProps = {
  title: string;
  status: ItemStatus;
  items: IntegrityItem[];
  description?: string;
};

const ICON = {
  ok: '✔',
  warning: '⚠',
  error: '❌',
} as const;

const ICON_CLASS = {
  ok: styles.iconOk,
  warning: styles.iconWarning,
  error: styles.iconError,
} as const;

export default function IntegrityCard({ title, status, items, description }: IntegrityCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.titleRow}>
        <span className={ICON_CLASS[status]} aria-hidden>
          {ICON[status]}
        </span>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <ul className={styles.list}>
        {items.map((item, i) => (
          <li key={i} className={styles.listItem}>
            <span className={ICON_CLASS[item.status]} aria-hidden>
              {ICON[item.status]}
            </span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
      {description && <p className={styles.desc}>{description}</p>}
    </section>
  );
}
