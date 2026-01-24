'use client';

import Link from 'next/link';
import styles from './page.module.css';
import { MESSAGE_TEMPLATE_GROUPS } from '@/src/constants/messageTemplates';
import { useI18n } from '@/src/contexts/I18nContext';
import { I18N_KEYS } from '@/src/i18n';

export default function MessageTemplatesPage() {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{t(I18N_KEYS.messageTemplates.pageTitle)}</h1>

      {MESSAGE_TEMPLATE_GROUPS.map((group) => (
        <section key={group.id} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t(group.titleKey)}</h2>
            {group.subtitleKey && <p className={styles.sectionSubtitle}>{t(group.subtitleKey)}</p>}
          </div>

          <div className={styles.grid}>
            {group.templates.map((template) => (
              <div key={template.id} className={styles.card}>
                <div className={styles.cardTitle}>{t(template.nameKey)}</div>
                <p className={styles.cardDescription}>{t(template.descriptionKey)}</p>
                <div className={styles.cardActions}>
                  <Link className={styles.actionPrimary} href={template.editorUrl}>
                    {t(I18N_KEYS.messageTemplates.actionEdit)}
                  </Link>
                  <Link className={styles.actionGhost} href={template.previewUrl}>
                    {t(I18N_KEYS.messageTemplates.actionPreview)}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
