/**
 * Account SSOT — 기존 bank/number/holder 호환 + 글로벌 금융 필드.
 */
import {
  getConceptPresentationConfig,
  type InvitationConceptType,
} from '@/src/invitation/conceptPresentationConfig';

export type InvitationAccountItem = {
  id: string;
  /** 용도/구분 (legacy: role) */
  label: string;
  /** 은행/금융기관 (legacy: bank) */
  financialInstitution: string;
  accountNumber: string;
  accountHolder: string;
  iban?: string;
  swiftBic?: string;
  routingCode?: string;
  paymentNote?: string;
};

type AccountSourceRecord = Record<string, unknown>;

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeInvitationAccount(
  raw: unknown,
  index: number
): InvitationAccountItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as AccountSourceRecord;

  const accountNumber = asText(record.accountNumber ?? record.number);
  const accountHolder = asText(record.accountHolder ?? record.holder);
  const financialInstitution = asText(
    record.financialInstitution ?? record.bankName ?? record.bank
  );
  const label = asText(record.label ?? record.role ?? record.purpose);

  // 번호·예금주·기관 중 하나라도 있어야 유효
  if (!accountNumber && !accountHolder && !financialInstitution && !label) {
    return null;
  }

  return {
    id: asText(record.id) || `account-${index + 1}`,
    label,
    financialInstitution,
    accountNumber,
    accountHolder,
    iban: asText(record.iban) || undefined,
    swiftBic: asText(record.swiftBic ?? record.swift) || undefined,
    routingCode: asText(record.routingCode ?? record.sortCode) || undefined,
    paymentNote: asText(record.paymentNote ?? record.note) || undefined,
  };
}

export function getInvitationAccountItems(source: unknown): InvitationAccountItem[] {
  if (!Array.isArray(source)) return [];
  return source
    .map((item, index) => normalizeInvitationAccount(item, index))
    .filter((item): item is InvitationAccountItem => Boolean(item));
}

export function isAccountItemComplete(account: InvitationAccountItem): boolean {
  return Boolean(
    account.financialInstitution.trim() &&
      account.accountNumber.trim() &&
      account.accountHolder.trim()
  );
}

export function resolveAccountEnabled(
  data: { accountEnabled?: unknown; accounts?: unknown } | null | undefined,
  conceptType: InvitationConceptType | string | null | undefined
): boolean {
  const config = getConceptPresentationConfig(conceptType);
  if (!config.account) return false;

  const accounts = getInvitationAccountItems(data?.accounts);
  if (typeof data?.accountEnabled === 'boolean') {
    return data.accountEnabled;
  }

  // optional concept (GENERAL): 기본 OFF
  if (config.accountOptional) {
    return config.accountDefaultEnabled;
  }

  // WEDDING/FUNERAL legacy: 계좌가 있으면 표시
  return accounts.length > 0;
}

/** Preview/Public 섹션 노출 여부 */
export function shouldShowAccountsSection(
  data: { accountEnabled?: unknown; accounts?: unknown; accountsTitle?: unknown } | null | undefined,
  conceptType: InvitationConceptType | string | null | undefined
): boolean {
  const config = getConceptPresentationConfig(conceptType);
  if (!config.account) return false;
  if (!resolveAccountEnabled(data, conceptType)) return false;
  const accounts = getInvitationAccountItems(data?.accounts).filter(isAccountItemComplete);
  return accounts.length > 0;
}

export function resolveAccountsSectionTitle(
  data: { accountsTitle?: unknown } | null | undefined,
  conceptType: InvitationConceptType | string | null | undefined
): string {
  const custom = asText(data?.accountsTitle);
  if (custom) return custom;
  return getConceptPresentationConfig(conceptType).accountsTitle;
}

/** 에디터/저장용 legacy 호환 payload */
export function toLegacyAccountPayload(account: InvitationAccountItem) {
  return {
    role: account.label,
    bank: account.financialInstitution,
    number: account.accountNumber,
    holder: account.accountHolder,
    ...(account.iban ? { iban: account.iban } : {}),
    ...(account.swiftBic ? { swiftBic: account.swiftBic } : {}),
    ...(account.routingCode ? { routingCode: account.routingCode } : {}),
    ...(account.paymentNote ? { paymentNote: account.paymentNote } : {}),
  };
}
