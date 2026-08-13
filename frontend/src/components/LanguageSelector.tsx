'use client';

import { useI18n } from '../contexts/I18nContext';
import { PRODUCT_LOCALE_OPTIONS, type ProductLocaleId } from '../i18n/productLocales';
import styles from './LanguageSelector.module.css';

type LanguageSelectorProps = {
  variant?: 'desktop' | 'mobile';
  onChangeLocale?: (locale: ProductLocaleId) => void;
};

export default function LanguageSelector({
  variant = 'desktop',
  onChangeLocale,
}: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();
  const isMobile = variant === 'mobile';

  const handleChange = (nextLocale: ProductLocaleId) => {
    setLocale(nextLocale);
    onChangeLocale?.(nextLocale);
  };

  return (
    <div className={isMobile ? styles.mobileRoot : styles.desktopRoot}>
      {isMobile && <span className={styles.mobileLabel}>{t('locale.selector.label')}</span>}
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value as ProductLocaleId)}
        className={isMobile ? styles.mobileSelect : styles.desktopSelect}
        aria-label={t('locale.selector.aria')}
        data-testid="locale-selector"
      >
        {PRODUCT_LOCALE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
