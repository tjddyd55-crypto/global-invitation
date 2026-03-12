'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/src/contexts/I18nContext';
import { LANGUAGE_STORAGE_KEY, type Language } from '@/src/i18n';
import styles from './LanguageFirstVisitModal.module.css';

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string; helper: string }> = [
  { value: 'ko', label: '한국어', helper: '한국어로 서비스를 시작합니다.' },
  { value: 'en', label: 'English', helper: 'Start with English.' },
  { value: 'mn', label: 'Монгол', helper: 'Монгол хэлээр эхлэх.' },
];

export default function LanguageFirstVisitModal() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (!storedLanguage) {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(false);
    }
  }, []);

  const selected = useMemo(
    () => LANGUAGE_OPTIONS.find((option) => option.value === language) || LANGUAGE_OPTIONS[0],
    [language]
  );

  if (!isOpen) {
    return null;
  }

  const handleSelect = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setIsOpen(false);
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Language setup">
      <div className={styles.modal}>
        <h2 className={styles.title}>사용할 언어를 선택해 주세요</h2>
        <p className={styles.subtitle}>최초 1회만 선택하면, 이후에는 Navbar에서 언제든 변경할 수 있습니다.</p>
        <div className={styles.optionList}>
          {LANGUAGE_OPTIONS.map((option) => {
            const active = selected.value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={active ? `${styles.option} ${styles.optionActive}` : styles.option}
                onClick={() => handleSelect(option.value)}
              >
                <strong>{option.label}</strong>
                <span>{option.helper}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
