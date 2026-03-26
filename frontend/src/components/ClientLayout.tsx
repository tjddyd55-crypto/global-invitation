'use client';

import { I18nProvider } from '../contexts/I18nContext';
import GlobalHeader from '@/src/components/layout/GlobalHeader';
import LanguageFirstVisitModal from './LanguageFirstVisitModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <GlobalHeader />
      <LanguageFirstVisitModal />
      {children}
    </I18nProvider>
  );
}
