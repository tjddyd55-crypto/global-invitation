'use client';

import { I18nProvider } from '../contexts/I18nContext';
import LanguageSelector from './LanguageSelector';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <LanguageSelector />
      {children}
    </I18nProvider>
  );
}
