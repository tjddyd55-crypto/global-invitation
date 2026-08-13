'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_PRODUCT_LOCALE, type ProductLocaleId } from './productLocales';

const InvitationLocaleContext = createContext<ProductLocaleId>(DEFAULT_PRODUCT_LOCALE);

export function InvitationLocaleProvider({
  locale,
  children,
}: {
  locale: ProductLocaleId;
  children: ReactNode;
}) {
  return <InvitationLocaleContext.Provider value={locale}>{children}</InvitationLocaleContext.Provider>;
}

export function useInvitationLocale(): ProductLocaleId {
  return useContext(InvitationLocaleContext);
}
