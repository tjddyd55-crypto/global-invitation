'use client';

import { useI18n } from '../contexts/I18nContext';
import type { Language } from '../i18n';

export default function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '1rem', 
      right: '1rem', 
      zIndex: 1000,
      padding: '0.5rem 0.6rem',
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      minWidth: '6rem',
    }}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        style={{
          padding: '0.25rem 0.5rem',
          fontSize: '0.9rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        <option value="en">English</option>
        <option value="ko">한국어</option>
        <option value="mn">Монгол</option>
      </select>
    </div>
  );
}
