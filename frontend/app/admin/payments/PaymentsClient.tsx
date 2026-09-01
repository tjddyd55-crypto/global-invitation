'use client';
/* eslint-disable i18next/no-literal-string */

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '@/src/features/admin/AdminPageHeader';
import {
  formatConfigured,
  formatMoneyUsd,
  formatPaymentChannel,
  formatPaymentStatus,
  formatRuntimeEnv,
} from '@/src/features/admin/adminDisplay';
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

export type AdminPaymentsTab = 'transactions' | 'pricing' | 'toss';

type AdminPaymentsPageProps = {
  initialTab: AdminPaymentsTab;
};

export default function AdminPaymentsPage({ initialTab }: AdminPaymentsPageProps) {
  const router = useRouter();
  const tab = initialTab;
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
  const isDevelopment = String(provider?.runtimeEnvironment || '').toLowerCase() !== 'production';

  const tabs = useMemo(
    () =>
      [
        { id: 'transactions' as const, label: '결제 내역' },
        { id: 'pricing' as const, label: '가격 설정' },
        { id: 'toss' as const, label: 'Toss Payments 설정' },
      ] as const,
    []
  );

  useEffect(() => {
    void getAdminSession().then(setSession).catch(() => setSession(null));
  }, []);

  useEffect(() => {
    void listAdminOpsPayments()
      .then((res) => setPayments(res.payments))
      .catch((err) => setError(err instanceof Error ? err.message : '결제 내역 로드 실패'));
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

  function selectTab(next: AdminPaymentsTab) {
    router.replace(`/admin/payments?tab=${next}`, { scroll: false });
  }

  async function savePricing() {
    if (!isSuper) {
      setStatusMsg('SUPER_ADMIN 권한이 필요합니다.');
      return;
    }
    const listPriceMinor = Math.round(Number(listDollars) * 100);
    const salePriceMinor = Math.round(Number(saleDollars) * 100);
    if (
      !window.confirm(
        `판매 가격을 변경하시겠습니까?\n정상가 ${formatMoneyUsd(listPriceMinor)} / 판매가 ${formatMoneyUsd(salePriceMinor)}\n변경 후 신규 결제부터 적용됩니다.`
      )
    ) {
      return;
    }
    try {
      await updateAdminOpsPricing({ listPriceMinor, salePriceMinor, promoEnabled });
      const next = await getAdminOpsPricing();
      setPricing(next);
      setStatusMsg('가격 설정이 저장되었습니다.');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : '가격 저장 실패');
    }
  }

  async function saveProvider(environment: 'TEST' | 'LIVE') {
    if (!isSuper) {
      setStatusMsg('SUPER_ADMIN 권한이 필요합니다.');
      return;
    }
    if (environment === 'LIVE') {
      if (
        !window.confirm(
          'LIVE 결제 키를 변경하시겠습니까?\n현재 DEVELOPMENT 환경입니다. LIVE 키는 저장할 수 있지만 실제 LIVE 결제 활성화는 제한됩니다.'
        )
      ) {
        return;
      }
    }
    const payload: Record<string, unknown> = { environment, enabled: true };
    if (environment === 'TEST') {
      if (testClient.trim()) payload.clientKey = testClient.trim();
      if (testSecret.trim()) payload.secretKey = testSecret.trim();
      if (testVariant.trim()) payload.variantKey = testVariant.trim();
    } else {
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
      setStatusMsg(`${environment} 설정이 저장되었습니다.`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Toss 설정 저장 실패');
    }
  }

  async function testConnection(environment: 'TEST' | 'LIVE') {
    if (!isSuper) return;
    try {
      const result = await testAdminOpsProviderConfig(environment);
      setStatusMsg(`연결 확인: ${JSON.stringify(result)}`);
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : '연결 확인 실패');
    }
  }

  const testView = (provider?.test || {}) as Record<string, unknown>;
  const liveView = (provider?.live || {}) as Record<string, unknown>;
  const encryptionConfigured = Boolean(provider?.encryptionConfigured);

  return (
    <>
      <AdminPageHeader
        breadcrumb={[
          { label: '관리자', href: '/admin/dashboard' },
          { label: '결제 관리' },
        ]}
        title="결제 관리"
        description="결제 내역과 가격, Toss Payments 연결 정보를 관리합니다."
      />

      <div className={styles.section} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? styles.primaryButton : styles.secondaryButton}
            onClick={() => selectTab(t.id)}
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
                <th>상태</th>
                <th>결제금액</th>
                <th>주문번호</th>
                <th>회원</th>
                <th>초대장</th>
                <th>결제 요청일</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={String(p.id)}>
                  <td>{formatPaymentStatus(String(p.status))}</td>
                  <td>{formatMoneyUsd(Number(p.amount || 0))}</td>
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
          <h2 className={styles.pageTitle}>초대장 판매 가격 설정</h2>
          <p className={styles.pageDescription}>
            상품명: 초대장 공개 이용권 · 이 가격은 실제 사용자 결제 화면과 결제 요청 금액에
            적용됩니다.
          </p>
          <p className={styles.pageDescription}>
            현재 적용 판매가: {formatMoneyUsd(pricing.effectivePriceMinor)} (source:{' '}
            {pricing.source})
          </p>
          <label>
            정상가 (USD)
            <input
              className={styles.input}
              value={listDollars}
              onChange={(e) => setListDollars(e.target.value)}
              disabled={!isSuper}
            />
          </label>
          <label>
            판매가 (USD)
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
            할인 적용
          </label>
          <button type="button" className={styles.primaryButton} onClick={() => void savePricing()}>
            저장
          </button>
        </section>
      )}

      {tab === 'toss' && provider && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>Toss Payments 설정</h2>
          <p className={styles.pageDescription}>
            현재 서비스 환경: {formatRuntimeEnv(String(provider.runtimeEnvironment))} · 현재 결제
            환경: {String(provider.activePaymentEnvironment)} · 결제 통화: USD · 결제 방식:{' '}
            {formatPaymentChannel(String(provider.channel || 'INTERNATIONAL_USD'))}
          </p>
          {!encryptionConfigured ? (
            <p className={styles.error}>
              암호화 키가 설정되지 않아 비밀키를 저장할 수 없습니다. Railway Backend 환경변수{' '}
              <strong>ADMIN_SETTINGS_ENCRYPTION_KEY</strong> 설정이 필요합니다.
            </p>
          ) : null}

          <article className={styles.card}>
            <h3>
              TEST 결제 설정
              <span className={`${styles.cardBadge} ${styles.cardBadgeTest}`}>테스트 결제</span>
            </h3>
            <p className={styles.helperText}>테스트 결제 검증에 사용하는 키입니다.</p>
            <p>
              Client Key: {formatConfigured(Boolean(testView.clientKeyConfigured))} (
              {String(testView.clientKeyMasked || '—')}) · Secret Key:{' '}
              {formatConfigured(Boolean(testView.secretKeyConfigured))} ({String(testView.secretKeyMasked || '—')}
              ) · Variant Key: {formatConfigured(Boolean(testView.variantKeyConfigured))} (
              {String(testView.variantKeyMasked || '—')})
            </p>
            {!testView.clientKeyConfigured && !testView.secretKeyConfigured ? (
              <p className={styles.pageDescription}>
                아직 TEST 결제 키가 등록되지 않았습니다. Toss Payments 테스트 키를 입력하면 연결
                상태를 확인할 수 있습니다.
              </p>
            ) : null}
            <label>
              Client Key
              <input
                className={styles.input}
                placeholder="기존 값을 변경하지 않으려면 입력하지 마세요"
                value={testClient}
                onChange={(e) => setTestClient(e.target.value)}
                disabled={!isSuper}
              />
            </label>
            <label>
              Secret Key
              <input
                className={styles.input}
                type="password"
                placeholder="기존 값을 변경하지 않으려면 입력하지 마세요"
                value={testSecret}
                onChange={(e) => setTestSecret(e.target.value)}
                disabled={!isSuper || !encryptionConfigured}
              />
            </label>
            <label>
              Variant Key
              <input
                className={styles.input}
                placeholder="기존 값을 변경하지 않으려면 입력하지 마세요"
                value={testVariant}
                onChange={(e) => setTestVariant(e.target.value)}
                disabled={!isSuper}
              />
            </label>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={() => void saveProvider('TEST')}>
                저장
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void testConnection('TEST')}
              >
                연결 확인
              </button>
            </div>
          </article>

          <article className={styles.card}>
            <h3>
              LIVE 결제 설정
              <span className={`${styles.cardBadge} ${styles.cardBadgeLive}`}>실제 결제 키</span>
            </h3>
            <p className={styles.helperText}>실제 결제가 발생하는 운영 키입니다.</p>
            {isDevelopment ? (
              <p className={styles.error}>
                현재 DEVELOPMENT 환경입니다. LIVE 키는 저장할 수 있지만 실제 LIVE 결제 활성화는
                제한됩니다.
              </p>
            ) : null}
            <p>
              Client Key: {formatConfigured(Boolean(liveView.clientKeyConfigured))} (
              {String(liveView.clientKeyMasked || '—')}) · Secret Key:{' '}
              {formatConfigured(Boolean(liveView.secretKeyConfigured))} ({String(liveView.secretKeyMasked || '—')}
              ) · Variant Key: {formatConfigured(Boolean(liveView.variantKeyConfigured))} (
              {String(liveView.variantKeyMasked || '—')})
            </p>
            <label>
              Client Key
              <input
                className={styles.input}
                placeholder="기존 값을 변경하지 않으려면 입력하지 마세요"
                value={liveClient}
                onChange={(e) => setLiveClient(e.target.value)}
                disabled={!isSuper}
              />
            </label>
            <label>
              Secret Key
              <input
                className={styles.input}
                type="password"
                placeholder="기존 값을 변경하지 않으려면 입력하지 마세요"
                value={liveSecret}
                onChange={(e) => setLiveSecret(e.target.value)}
                disabled={!isSuper || !encryptionConfigured}
              />
            </label>
            <label>
              Variant Key
              <input
                className={styles.input}
                placeholder="기존 값을 변경하지 않으려면 입력하지 마세요"
                value={liveVariant}
                onChange={(e) => setLiveVariant(e.target.value)}
                disabled={!isSuper}
              />
            </label>
            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} onClick={() => void saveProvider('LIVE')}>
                저장
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void testConnection('LIVE')}
              >
                연결 확인
              </button>
            </div>
          </article>
          <p className={styles.helperText}>{String(provider.foreignMidNote || '')}</p>
        </section>
      )}
    </>
  );
}
