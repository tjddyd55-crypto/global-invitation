'use client';

import { useI18n } from '../contexts/I18nContext';
import type { Language } from '../i18n';
import styles from './LanguageSelector.module.css';

type LanguageSelectorProps = {
  variant?: 'desktop' | 'mobile';
  onChangeLanguage?: (lang: Language) => void;
};

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'mn', label: 'Монгол' },
];

export default function LanguageSelector({
  variant = 'desktop',
  onChangeLanguage,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useI18n();
  const isMobile = variant === 'mobile';

  const handleChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    onChangeLanguage?.(nextLanguage);
  };

  return (
    <div className={isMobile ? styles.mobileRoot : styles.desktopRoot}>
      {isMobile && <span className={styles.mobileLabel}>Language</span>}
      <select
        value={language}
        onChange={(e) => handleChange(e.target.value as Language)}
        className={isMobile ? styles.mobileSelect : styles.desktopSelect}
        aria-label="Language selector"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
