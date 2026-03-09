'use client';

import { I18nProvider } from '../contexts/I18nContext';
import LanguageSelector from './LanguageSelector';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldShowLanguageSelector = pathname === '/';

  return (
    <I18nProvider>
      {shouldShowLanguageSelector ? <LanguageSelector /> : null}
      {children}
    </I18nProvider>
  );
}
