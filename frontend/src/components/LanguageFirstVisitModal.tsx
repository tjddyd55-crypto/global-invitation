'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/src/contexts/I18nContext';
import {
  hasExplicitLocaleChoice,
  PRODUCT_LOCALE_OPTIONS,
  type ProductLocaleId,
} from '@/src/i18n/productLocales';
import styles from './LanguageFirstVisitModal.module.css';

export default function LanguageFirstVisitModal() {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!hasExplicitLocaleChoice()) {
      setIsOpen(true);
    }
  }, []);

  const selected = useMemo(
    () => PRODUCT_LOCALE_OPTIONS.find((option) => option.id === locale) || PRODUCT_LOCALE_OPTIONS[0],
    [locale]
  );

  if (!isOpen) {
    return null;
  }

  const handleSelect = (nextLocale: ProductLocaleId) => {
    setLocale(nextLocale);
    setIsOpen(false);
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={t('locale.selector.aria')}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{t('locale.firstVisit.title')}</h2>
        <p className={styles.subtitle}>{t('locale.firstVisit.subtitle')}</p>
        <div className={styles.optionList}>
          {PRODUCT_LOCALE_OPTIONS.map((option) => {
            const active = selected.id === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={active ? `${styles.option} ${styles.optionActive}` : styles.option}
                onClick={() => handleSelect(option.id)}
                data-testid={`locale-first-visit-${option.language}`}
              >
                <strong>{option.label}</strong>
                <span>{t(option.id === 'ko-KR' ? 'locale.ko.helper' : 'locale.en.helper')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
