'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { invitationT } from './invitationT';
import {
  DEFAULT_PRODUCT_LOCALE,
  languageFromLocale,
  type ProductLocaleId,
} from './productLocales';

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

/** Invitation.language SSOT — never service useI18n(). */
export function useInvitationT() {
  const locale = useInvitationLocale();
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => invitationT(locale, key, vars),
    [locale]
  );
  return { locale, t, language: languageFromLocale(locale) };
}
