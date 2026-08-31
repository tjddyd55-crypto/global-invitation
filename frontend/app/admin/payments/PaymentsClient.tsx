'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getAdminOpsPricing,
  getAdminOpsProviderConfig,
  listAdminOpsPayments,
  testAdminOpsProviderConfig,
  updateAdminOpsPricing,
  updateAdminOpsProviderConfig,
  getAdminSession,
  type AdminSession,
} from '@/src/lib/adminApi';
import styles from '@/src/components/admin/AdminShell.module.css';

type Tab = 'transactions' | 'pricing' | 'toss';

function money(minor: number) {
  return `$${(minor / 100).toFixed(2)} USD`;
}

export default function AdminPaymentsPage() {
  const search = useSearchParams();
  const initialTab = (search.get('tab') as Tab) || 'transactions';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
  const [pricing, setPricing] = useState<{
    listPriceMinor: number;
    salePriceMinor: number;
    promoEnabled: boolean;
    effectivePriceMinor: number;
    source: string;
  } | null>(null);
  const [provider, setProvider] = useState<Record<string, unknown> | null>(null);
  const [listDollars, setListDollars] = useState('30.00');
  const [saleDollars, setSaleDollars] = useState('10.00');
  const [promoEnabled, setPromoEnabled] = useState(true);
  const [testClient, setTestClient] = useState('');
  const [testSecret, setTestSecret] = useState('');
  const [testVariant, setTestVariant] = useState('');
  const [liveClient, setLiveClient] = useState('');
  const [liveSecret, setLiveSecret] = useState('');
  const [liveVariant, setLiveVariant] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isSuper = session?.role === 'SUPER_ADMIN';

  const tabs = useMemo(
    () =>
      [
        { id: 'transactions' as const, label: 'Transactions' },
        { id: 'pricing' as const, label: 'Pricing' },
        { id: 'toss' as const, label: 'Toss Settings' },
      ] as const,
    []
  );

  useEffect(() => {
    void getAdminSession().then(setSession).catch(() => setSession(null));
  }, []);

  useEffect(() => {
    void listAdminOpsPayments()
      .then((res) => setPayments(res.payments))
      .catch((err) => setError(err instanceof Error ? err.message : 'Payments failed'));
    void getAdminOpsPricing()
      .then((p) => {
        setPricing(p);
        setListDollars((p.listPriceMinor / 100).toFixed(2));
        setSaleDollars((p.salePriceMinor / 100).toFixed(2));
        setPromoEnabled(p.promoEnabled);
      })
      .catch(() => undefined);
    void getAdminOpsProviderConfig()
      .then(setProvider)
      .catch(() => undefined);
  }, []);

  async function savePricing() {
    if (!isSuper) {
      setStatusMsg('SUPER_ADMIN required');
      return;
    }
    const listPriceMinor = Math.round(Number(listDollars) * 100);
    const salePriceMinor = Math.round(Number(saleDollars) * 100);
    if (
      !window.confirm(`Change pricing to ${money(listPriceMinor)} / ${money(salePriceMinor)}?`)
    ) {
      return;
    }
    try {
      await updateAdminOpsPricing({ listPriceMinor, salePriceMinor, promoEnabled });
      const next = await getAdminOpsPricing();
      setPricing(next);
      setStatusMsg('Pricing saved');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Pricing save failed');
    }
  }

  async function saveProvider(environment: 'TEST' | 'LIVE') {
    if (!isSuper) {
      setStatusMsg('SUPER_ADMIN required');
      return;
    }
    const payload: Record<string, unknown> = {
      environment,
      enabled: true,
    };
    if (environment === 'TEST') {
      if (testClient.trim()) payload.clientKey = testClient.trim();
      if (testSecret.trim()) payload.secretKey = testSecret.trim();
      if (testVariant.trim()) payload.variantKey = testVariant.trim();
    } else {
      if (
        !window.confirm(
          'DEVELOPMENT environment: LIVE keys may be stored but LIVE charges stay blocked. Continue?'
        )
      ) {
        return;
      }
      if (liveClient.trim()) payload.clientKey = liveClient.trim();
      if (liveSecret.trim()) payload.secretKey = liveSecret.trim();
      if (liveVariant.trim()) payload.variantKey = liveVariant.trim();
    }
    try {
      await updateAdminOpsProviderConfig(payload);
      setProvider(await getAdminOpsProviderConfig());
      setTestClient('');
      setTestSecret('');
      setTestVariant('');
      setLiveClient('');
      setLiveSecret('');
      setLiveVariant('');
      setStatusMsg(`${environment} config saved (masked)`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Provider save failed');
    }
  }

  async function testConnection(environment: 'TEST' | 'LIVE') {
    if (!isSuper) return;
    try {
      const result = await testAdminOpsProviderConfig(environment);
      setStatusMsg(JSON.stringify(result));
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Connection test failed');
    }
  }

  const testView = (provider?.test || {}) as Record<string, unknown>;
  const liveView = (provider?.live || {}) as Record<string, unknown>;

  return (
    <>
      <div className={styles.topbar}>
        <div>
          <h1 className={styles.pageTitle}>Payments</h1>
          <p className={styles.pageDescription}>
            Channel: INTERNATIONAL_USD · Currency: USD · Runtime:{' '}
            {String(provider?.runtimeEnvironment || 'development')}
          </p>
        </div>
      </div>

      <div className={styles.section} style={{ display: 'flex', gap: 8 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? styles.primaryButton : styles.secondaryButton}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {statusMsg && <p className={styles.pageDescription}>{statusMsg}</p>}

      {tab === 'transactions' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Amount</th>
                <th>Order</th>
                <th>User</th>
                <th>Invitation</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={String(p.id)}>
                  <td>{String(p.status)}</td>
                  <td>{money(Number(p.amount || 0))}</td>
                  <td>{String(p.orderId || '')}</td>
                  <td>{String(p.userEmail || p.userId || '')}</td>
                  <td>{String(p.invitationTitle || p.invitationId)}</td>
                  <td>{String(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pricing' && pricing && (
        <section className={styles.section}>
          <p className={styles.pageDescription}>
            Effective: {money(pricing.effectivePriceMinor)} · source={pricing.source}
          </p>
          <label>
            List price (USD)
            <input
              className={styles.input}
              value={listDollars}
              onChange={(e) => setListDollars(e.target.value)}
              disabled={!isSuper}
            />
          </label>
          <label>
            Sale price (USD)
            <input
              className={styles.input}
              value={saleDollars}
              onChange={(e) => setSaleDollars(e.target.value)}
              disabled={!isSuper}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={promoEnabled}
              onChange={(e) => setPromoEnabled(e.target.checked)}
              disabled={!isSuper}
            />{' '}
            Promo enabled
          </label>
          <button type="button" className={styles.primaryButton} onClick={() => void savePricing()}>
            Save pricing
          </button>
        </section>
      )}

      {tab === 'toss' && provider && (
        <section className={styles.section}>
          <p className={styles.pageDescription}>
            Active env: {String(provider.activePaymentEnvironment)} · Encryption:{' '}
            {String(provider.encryptionConfigured)} · {String(provider.foreignMidNote)}
          </p>
          <article className={styles.card}>
            <h3>TEST</h3>
            <p>
              configured client={String(testView.clientKeyMasked || '—')} secret=
              {String(testView.secretKeyMasked || '—')}
            </p>
            <input
              className={styles.input}
              placeholder="Client key (blank = keep)"
              value={testClient}
              onChange={(e) => setTestClient(e.target.value)}
              disabled={!isSuper}
            />
            <input
              className={styles.input}
              placeholder="Secret key (blank = keep)"
              value={testSecret}
              onChange={(e) => setTestSecret(e.target.value)}
              disabled={!isSuper}
            />
            <input
              className={styles.input}
              placeholder="Variant key (blank = keep)"
              value={testVariant}
              onChange={(e) => setTestVariant(e.target.value)}
              disabled={!isSuper}
            />
            <button type="button" className={styles.primaryButton} onClick={() => void saveProvider('TEST')}>
              Save TEST
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void testConnection('TEST')}
            >
              Test connection
            </button>
          </article>
          <article className={styles.card}>
            <h3>LIVE</h3>
            <p>
              configured client={String(liveView.clientKeyMasked || '—')} secret=
              {String(liveView.secretKeyMasked || '—')}
            </p>
            <input
              className={styles.input}
              placeholder="Client key (blank = keep)"
              value={liveClient}
              onChange={(e) => setLiveClient(e.target.value)}
              disabled={!isSuper}
            />
            <input
              className={styles.input}
              placeholder="Secret key (blank = keep)"
              value={liveSecret}
              onChange={(e) => setLiveSecret(e.target.value)}
              disabled={!isSuper}
            />
            <input
              className={styles.input}
              placeholder="Variant key (blank = keep)"
              value={liveVariant}
              onChange={(e) => setLiveVariant(e.target.value)}
              disabled={!isSuper}
            />
            <button type="button" className={styles.primaryButton} onClick={() => void saveProvider('LIVE')}>
              Save LIVE
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void testConnection('LIVE')}
            >
              Test connection
            </button>
          </article>
        </section>
      )}
    </>
  );
}
