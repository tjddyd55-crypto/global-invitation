'use client';

import styles from './adminUi.module.css';

type AdminTabItem<T extends string> = {
  id: T;
  label: string;
};

type AdminTabsProps<T extends string> = {
  tabs: readonly AdminTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
};

export default function AdminTabs<T extends string>({ tabs, active, onChange }: AdminTabsProps<T>) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={[styles.tab, active === tab.id ? styles.tabActive : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
