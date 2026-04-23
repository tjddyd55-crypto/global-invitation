'use client';

import { I18nProvider } from '../contexts/I18nContext';
import GlobalHeader from '@/src/components/layout/GlobalHeader';
import LanguageFirstVisitModal from './LanguageFirstVisitModal';
import { SubscriptionProvider } from '@/src/shared/billing';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SubscriptionProvider>
        <GlobalHeader />
        <LanguageFirstVisitModal />
        {children}
      </SubscriptionProvider>
    </I18nProvider>
  );
}
