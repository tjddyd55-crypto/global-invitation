import { buildAdminApiUrl, buildAdminRequestInit } from '@/src/lib/adminApi';

async function parseSuperJson<T>(response: Response): Promise<T> {
  if (response.status === 403) {
    throw new Error('SUPER_ADMIN_REQUIRED');
  }
  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      const payload = (await response.json()) as { error?: string };
      errorMessage = payload.error || errorMessage;
    } catch {
      errorMessage = await response.text().catch(() => errorMessage);
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

const SUPER_BASE = '/api/admin/super';

export type CreditPolicyRow = {
  id: string;
  key: string;
  cost: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreditPackageRow = {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SuperUserRow = {
  userId: string;
  email: string;
  balance: number;
};

export type CreditTransactionRow = {
  id: string;
  userId: string;
  amount: number;
  type: string;
  reason: string | null;
  beforeBalance: number;
  afterBalance: number;
  createdAt: string;
};

export type AdminAuditLogRow = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  payload: unknown;
  createdAt: string;
};

export async function fetchSuperCreditPolicies(): Promise<CreditPolicyRow[]> {
  const res = await fetch(buildAdminApiUrl(`${SUPER_BASE}/credit-policies`), buildAdminRequestInit());
  const body = await parseSuperJson<{ items: CreditPolicyRow[] }>(res);
  return body.items ?? [];
}

export async function patchSuperCreditPolicy(
  key: string,
  body: { cost?: number; active?: boolean }
): Promise<CreditPolicyRow> {
  const encoded = encodeURIComponent(key);
  const res = await fetch(buildAdminApiUrl(`${SUPER_BASE}/credit-policies/${encoded}`), {
    ...buildAdminRequestInit(),
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return parseSuperJson<CreditPolicyRow>(res);
}

export async function fetchSuperCreditPackages(): Promise<CreditPackageRow[]> {
  const res = await fetch(buildAdminApiUrl(`${SUPER_BASE}/credit-packages`), buildAdminRequestInit());
  const body = await parseSuperJson<{ items: CreditPackageRow[] }>(res);
  return body.items ?? [];
}

export async function createSuperCreditPackage(payload: {
  name: string;
  credits: number;
  priceCents?: number;
  sortOrder?: number;
  active?: boolean;
}): Promise<CreditPackageRow> {
  const res = await fetch(buildAdminApiUrl(`${SUPER_BASE}/credit-packages`), {
    ...buildAdminRequestInit(),
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseSuperJson<CreditPackageRow>(res);
}

export async function patchSuperCreditPackage(
  id: string,
  body: Partial<{ name: string; credits: number; priceCents: number; sortOrder: number; active: boolean }>
): Promise<CreditPackageRow> {
  const res = await fetch(buildAdminApiUrl(`${SUPER_BASE}/credit-packages/${id}`), {
    ...buildAdminRequestInit(),
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return parseSuperJson<CreditPackageRow>(res);
}

export async function fetchSuperUsers(q?: string): Promise<SuperUserRow[]> {
  const params = new URLSearchParams();
  if (q?.trim()) params.set('q', q.trim());
  const qs = params.toString();
  const res = await fetch(
    buildAdminApiUrl(`${SUPER_BASE}/users${qs ? `?${qs}` : ''}`),
    buildAdminRequestInit()
  );
  const body = await parseSuperJson<{ items: SuperUserRow[] }>(res);
  return body.items ?? [];
}

export async function postSuperUserCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<CreditTransactionRow> {
  const res = await fetch(buildAdminApiUrl(`${SUPER_BASE}/users/${userId}/credits`), {
    ...buildAdminRequestInit(),
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  });
  return parseSuperJson<CreditTransactionRow>(res);
}

export async function fetchSuperTransactions(limit = 200): Promise<CreditTransactionRow[]> {
  const res = await fetch(
    buildAdminApiUrl(`${SUPER_BASE}/transactions?limit=${limit}`),
    buildAdminRequestInit()
  );
  const body = await parseSuperJson<{ items: CreditTransactionRow[] }>(res);
  return body.items ?? [];
}

export async function fetchSuperLogs(limit = 200): Promise<AdminAuditLogRow[]> {
  const res = await fetch(buildAdminApiUrl(`${SUPER_BASE}/logs?limit=${limit}`), buildAdminRequestInit());
  const body = await parseSuperJson<{ items: AdminAuditLogRow[] }>(res);
  return body.items ?? [];
}

export async function postSuperBulkGrant(body: {
  country?: string | null;
  registeredAfter?: string | null;
  registeredBefore?: string | null;
  amount: number;
  reason: string;
}): Promise<{ affected: number }> {
  const res = await fetch(buildAdminApiUrl(`${SUPER_BASE}/bulk-grant`), {
    ...buildAdminRequestInit(),
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseSuperJson<{ affected: number }>(res);
}
