'use client';

import { I18nProvider } from '../contexts/I18nContext';
import GlobalHeader from '@/src/components/layout/GlobalHeader';
import LanguageFirstVisitModal from './LanguageFirstVisitModal';
import { SubscriptionProvider } from '@/src/shared/billing';
import { AuthProvider } from '@/src/shared/auth/AuthProvider';
import { isPlatformAppPath } from '@/src/shared/platform/platformAppPath';
import { isPublicInvitationPath } from '@/src/shared/platform/publicInvitationPath';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicInvite = isPublicInvitationPath(pathname);
  const isPlatformShell = isPlatformAppPath(pathname);
  const showSaasChrome = !isPublicInvite && !isPlatformShell;

  return (
    <I18nProvider>
      <AuthProvider>
        <SubscriptionProvider>
          {showSaasChrome ? <GlobalHeader /> : null}
          {showSaasChrome ? <LanguageFirstVisitModal /> : null}
          {children}
        </SubscriptionProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
