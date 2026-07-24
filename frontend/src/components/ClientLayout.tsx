'use client';

import { I18nProvider } from '../contexts/I18nContext';
import GlobalHeader from '@/src/components/layout/GlobalHeader';
import LanguageFirstVisitModal from './LanguageFirstVisitModal';
import { SubscriptionProvider } from '@/src/shared/billing';
import { isPublicInvitationPath } from '@/src/shared/platform/publicInvitationPath';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicInvite = isPublicInvitationPath(pathname);

  return (
    <I18nProvider>
      <SubscriptionProvider>
        {!isPublicInvite ? <GlobalHeader /> : null}
        {!isPublicInvite ? <LanguageFirstVisitModal /> : null}
        {children}
      </SubscriptionProvider>
    </I18nProvider>
  );
}
