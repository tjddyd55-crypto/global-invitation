'use client';

import { I18nProvider } from '../contexts/I18nContext';
import LanguageFirstVisitModal from './LanguageFirstVisitModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <LanguageFirstVisitModal />
      {children}
    </I18nProvider>
  );
}
