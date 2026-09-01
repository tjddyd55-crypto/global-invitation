'use client';
/* eslint-disable i18next/no-literal-string */

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import AdminPageHeader from '@/src/features/admin/AdminPageHeader';
import {
  formatConfigured,
  formatMoneyUsd,
  formatPaymentChannel,
  formatPaymentStatus,
  formatRuntimeEnv,
  parseUsdInput,
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
import {
  AdminButton,
  AdminCheckbox,
  AdminConfirmDialog,
  AdminFeedback,
  AdminField,
  AdminInput,
  AdminPermissionNotice,
  AdminTabs,
} from '@/src/components/admin/ui';
import styles from '@/src/components/admin/AdminShell.module.css';
import ui from '@/src/components/admin/ui/adminUi.module.css';

export type AdminPaymentsTab = 'transactions' | 'pricing' | 'toss';

type AdminPaymentsPageProps = {
  initialTab: AdminPaymentsTab;
};

export default function AdminPaymentsPage({ initialTab }: AdminPaymentsPageProps) {
  const router = useRouter();
  const tab = initialTab;
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
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
  const [statusTone, setStatusTone] = useState<'success' | 'error' | 'info'>('info');
  const [savingPricing, setSavingPricing] = useState(false);
  const [savingProvider, setSavingProvider] = useState<'TEST' | 'LIVE' | null>(null);
  const [confirmPricingOpen, setConfirmPricingOpen] = useState(false);
  const [confirmProvider, setConfirmProvider] = useState<'TEST' | 'LIVE' | null>(null);
  const pricingHydratedRef = useRef(false);

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
    void getAdminSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    void listAdminOpsPayments()
      .then((res) => setPayments(res.payments))
      .catch((err) => setError(err instanceof Error ? err.message : '결제 내역 로드 실패'));
    void getAdminOpsPricing()
      .then((p) => {
        setPricing(p);
        setPricingError(null);
        if (!pricingHydratedRef.current) {
          setListDollars((p.listPriceMinor / 100).toFixed(2));
          setSaleDollars((p.salePriceMinor / 100).toFixed(2));
          setPromoEnabled(p.promoEnabled);
          pricingHydratedRef.current = true;
        }
      })
      .catch((err) => {
        setPricingError(err instanceof Error ? err.message : '가격 설정 로드 실패');
      });
    void getAdminOpsProviderConfig()
      .then((res) => {
        setProvider(res);
        setProviderError(null);
      })
      .catch((err) => {
        setProviderError(err instanceof Error ? err.message : 'Toss 설정 로드 실패');
      });
  }, []);

  function selectTab(next: AdminPaymentsTab) {
    router.replace(`/admin/payments?tab=${next}`, { scroll: false });
  }

  function notify(message: string, tone: 'success' | 'error' | 'info' = 'info') {
    setStatusMsg(message);
    setStatusTone(tone);
  }

  async function savePricing() {
    if (!isSuper) {
      notify('SUPER_ADMIN 권한에서만 가격을 변경할 수 있습니다.', 'error');
      return;
    }
    const listPriceMinor = parseUsdInput(listDollars);
    const salePriceMinor = parseUsdInput(saleDollars);
    if (listPriceMinor == null || salePriceMinor == null) {
      notify('가격은 0보다 큰 USD 금액(소수점 2자리)으로 입력해 주세요.', 'error');
      return;
    }
    if (salePriceMinor > listPriceMinor) {
      notify('판매가는 정상가보다 클 수 없습니다.', 'error');
      return;
    }
    if (listPriceMinor % 100 !== 0 || salePriceMinor % 100 !== 0) {
      notify('USD 금액은 센트 단위(예: 30.00)로 입력해 주세요.', 'error');
      return;
    }

    setSavingPricing(true);
    try {
      await updateAdminOpsPricing({ listPriceMinor, salePriceMinor, promoEnabled });
      const next = await getAdminOpsPricing();
      setPricing(next);
      notify('가격 설정이 저장되었습니다.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : '가격 저장 실패', 'error');
    } finally {
      setSavingPricing(false);
      setConfirmPricingOpen(false);
    }
  }

  async function saveProvider(environment: 'TEST' | 'LIVE') {
    if (!isSuper) {
      notify('SUPER_ADMIN 권한에서만 Toss 설정을 변경할 수 있습니다.', 'error');
      return;
    }

    const payload: Record<string, unknown> = { environment, enabled: true };
    const secretValue = environment === 'TEST' ? testSecret.trim() : liveSecret.trim();
    if (environment === 'TEST') {
      if (testClient.trim()) payload.clientKey = testClient.trim();
      if (testSecret.trim()) payload.secretKey = testSecret.trim();
      if (testVariant.trim()) payload.variantKey = testVariant.trim();
    } else {
      if (liveClient.trim()) payload.clientKey = liveClient.trim();
      if (liveSecret.trim()) payload.secretKey = liveSecret.trim();
      if (liveVariant.trim()) payload.variantKey = liveVariant.trim();
    }

    if (secretValue && !encryptionConfigured) {
      notify(
        '암호화 설정이 없어 Secret Key를 저장할 수 없습니다. Railway Backend의 ADMIN_SETTINGS_ENCRYPTION_KEY 설정을 확인해 주세요.',
        'error'
      );
      return;
    }

    setSavingProvider(environment);
    try {
      await updateAdminOpsProviderConfig(payload);
      setProvider(await getAdminOpsProviderConfig());
      setTestClient('');
      setTestSecret('');
      setTestVariant('');
      setLiveClient('');
      setLiveSecret('');
      setLiveVariant('');
      notify(`${environment} 설정이 저장되었습니다.`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Toss 설정 저장 실패', 'error');
    } finally {
      setSavingProvider(null);
      setConfirmProvider(null);
    }
  }

  async function testConnection(environment: 'TEST' | 'LIVE') {
    if (!isSuper) return;
    try {
      const result = await testAdminOpsProviderConfig(environment);
      notify(`연결 확인: ${JSON.stringify(result)}`, 'info');
    } catch (err) {
      notify(err instanceof Error ? err.message : '연결 확인 실패', 'error');
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

      <div className={styles.section} style={{ paddingBottom: 12 }}>
        <AdminTabs tabs={tabs} active={tab} onChange={selectTab} />
      </div>

      {error && <AdminFeedback tone="error" message={error} />}
      <AdminFeedback tone={statusTone} message={statusMsg} />

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

      {tab === 'pricing' && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>초대장 판매 가격 설정</h2>
          <p className={styles.pageDescription}>
            상품명: 초대장 공개 이용권 · 이 가격은 실제 사용자 결제 화면과 결제 요청 금액에
            적용됩니다.
          </p>
          {pricingError ? <AdminFeedback tone="error" message={pricingError} /> : null}
          {pricing ? (
            <p className={styles.pageDescription}>
              현재 적용 판매가: {formatMoneyUsd(pricing.effectivePriceMinor)} (source: {pricing.source})
            </p>
          ) : null}
          {sessionReady && !isSuper ? (
            <AdminPermissionNotice message="가격 설정은 SUPER_ADMIN 권한에서만 수정할 수 있습니다. SUPER_ADMIN 계정으로 로그인해 주세요." />
          ) : null}
          <div className={ui.formStack}>
            <AdminField label="정상가 (USD)">
              <AdminInput
                value={listDollars}
                onChange={(e) => setListDollars(e.target.value)}
                inputMode="decimal"
                placeholder="30.00"
                readOnly={sessionReady && !isSuper}
              />
            </AdminField>
            <AdminField label="판매가 (USD)">
              <AdminInput
                value={saleDollars}
                onChange={(e) => setSaleDollars(e.target.value)}
                inputMode="decimal"
                placeholder="10.00"
                readOnly={sessionReady && !isSuper}
              />
            </AdminField>
            <AdminCheckbox
              label="할인 적용"
              checked={promoEnabled}
              onChange={setPromoEnabled}
              disabled={sessionReady && !isSuper}
            />
            <AdminButton
              variant="primary"
              loading={savingPricing}
              disabled={!isSuper}
              onClick={() => setConfirmPricingOpen(true)}
            >
              저장
            </AdminButton>
          </div>
        </section>
      )}

      {tab === 'toss' && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>Toss Payments 설정</h2>
          {providerError ? <AdminFeedback tone="error" message={providerError} /> : null}
          {provider ? (
            <p className={styles.pageDescription}>
              현재 서비스 환경: {formatRuntimeEnv(String(provider.runtimeEnvironment))} · 현재 결제
              환경: {String(provider.activePaymentEnvironment)} · 결제 통화: USD · 결제 방식:{' '}
              {formatPaymentChannel(String(provider.channel || 'INTERNATIONAL_USD'))}
            </p>
          ) : null}
          {sessionReady && !isSuper ? (
            <AdminPermissionNotice message="Toss Payments 설정은 SUPER_ADMIN 권한에서만 수정할 수 있습니다." />
          ) : null}
          {!encryptionConfigured ? (
            <AdminFeedback
              tone="error"
              message="암호화 키가 설정되지 않았습니다. Secret Key 저장은 ADMIN_SETTINGS_ENCRYPTION_KEY 설정 후 가능합니다. Client Key는 입력·저장할 수 있습니다."
            />
          ) : null}

          {provider ? (
            <>
              <article className={styles.card}>
                <h3>
                  TEST 결제 설정
                  <span className={`${styles.cardBadge} ${styles.cardBadgeTest}`}>테스트 결제</span>
                </h3>
                <p className={styles.helperText}>테스트 결제 검증에 사용하는 키입니다.</p>
                <p>
                  Client Key: {formatConfigured(Boolean(testView.clientKeyConfigured))} (
                  {String(testView.clientKeyMasked || '—')}) · Secret Key:{' '}
                  {formatConfigured(Boolean(testView.secretKeyConfigured))} (
                  {String(testView.secretKeyMasked || '—')}) · Variant Key:{' '}
                  {formatConfigured(Boolean(testView.variantKeyConfigured))} (
                  {String(testView.variantKeyMasked || '—')})
                </p>
                <div className={ui.formStack}>
                  <AdminField label="Client Key" helper="기존 값을 변경하지 않으려면 입력하지 마세요.">
                    <AdminInput
                      value={testClient}
                      onChange={(e) => setTestClient(e.target.value)}
                      readOnly={sessionReady && !isSuper}
                    />
                  </AdminField>
                  <AdminField label="Secret Key" helper="비워두면 기존 Secret Key를 유지합니다.">
                    <AdminInput
                      type="password"
                      value={testSecret}
                      onChange={(e) => setTestSecret(e.target.value)}
                      readOnly={sessionReady && !isSuper}
                    />
                  </AdminField>
                  <AdminField label="Variant Key">
                    <AdminInput
                      value={testVariant}
                      onChange={(e) => setTestVariant(e.target.value)}
                      readOnly={sessionReady && !isSuper}
                    />
                  </AdminField>
                  <div className={ui.buttonGroup}>
                    <AdminButton
                      variant="primary"
                      disabled={!isSuper}
                      loading={savingProvider === 'TEST'}
                      onClick={() => setConfirmProvider('TEST')}
                    >
                      저장
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      disabled={!isSuper}
                      onClick={() => void testConnection('TEST')}
                    >
                      연결 확인
                    </AdminButton>
                  </div>
                </div>
              </article>

              <article className={styles.card}>
                <h3>
                  LIVE 결제 설정
                  <span className={`${styles.cardBadge} ${styles.cardBadgeLive}`}>실제 결제 키</span>
                </h3>
                <p className={styles.helperText}>실제 결제가 발생하는 운영 키입니다.</p>
                {isDevelopment ? (
                  <AdminFeedback
                    tone="error"
                    message="현재 DEVELOPMENT 환경입니다. LIVE 키는 저장할 수 있지만 실제 LIVE 결제 활성화는 제한됩니다."
                  />
                ) : null}
                <p>
                  Client Key: {formatConfigured(Boolean(liveView.clientKeyConfigured))} (
                  {String(liveView.clientKeyMasked || '—')}) · Secret Key:{' '}
                  {formatConfigured(Boolean(liveView.secretKeyConfigured))} (
                  {String(liveView.secretKeyMasked || '—')}) · Variant Key:{' '}
                  {formatConfigured(Boolean(liveView.variantKeyConfigured))} (
                  {String(liveView.variantKeyMasked || '—')})
                </p>
                <div className={ui.formStack}>
                  <AdminField label="Client Key">
                    <AdminInput
                      value={liveClient}
                      onChange={(e) => setLiveClient(e.target.value)}
                      readOnly={sessionReady && !isSuper}
                    />
                  </AdminField>
                  <AdminField label="Secret Key" helper="비워두면 기존 Secret Key를 유지합니다.">
                    <AdminInput
                      type="password"
                      value={liveSecret}
                      onChange={(e) => setLiveSecret(e.target.value)}
                      readOnly={sessionReady && !isSuper}
                    />
                  </AdminField>
                  <AdminField label="Variant Key">
                    <AdminInput
                      value={liveVariant}
                      onChange={(e) => setLiveVariant(e.target.value)}
                      readOnly={sessionReady && !isSuper}
                    />
                  </AdminField>
                  <div className={ui.buttonGroup}>
                    <AdminButton
                      variant="primary"
                      disabled={!isSuper}
                      loading={savingProvider === 'LIVE'}
                      onClick={() => setConfirmProvider('LIVE')}
                    >
                      저장
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      disabled={!isSuper}
                      onClick={() => void testConnection('LIVE')}
                    >
                      연결 확인
                    </AdminButton>
                  </div>
                </div>
              </article>
              <p className={styles.helperText}>{String(provider.foreignMidNote || '')}</p>
            </>
          ) : null}
        </section>
      )}

      <AdminConfirmDialog
        open={confirmPricingOpen}
        title="가격 설정을 변경하시겠습니까?"
        description={`정상가 ${listDollars} USD / 판매가 ${saleDollars} USD로 저장합니다. 변경 후 신규 결제부터 적용됩니다.`}
        confirmLabel="저장"
        loading={savingPricing}
        onCancel={() => setConfirmPricingOpen(false)}
        onConfirm={() => void savePricing()}
      />

      <AdminConfirmDialog
        open={confirmProvider === 'TEST'}
        title="TEST Toss 설정을 저장하시겠습니까?"
        description="입력한 키만 업데이트되며, 비워둔 Secret Key는 기존 값을 유지합니다."
        confirmLabel="저장"
        loading={savingProvider === 'TEST'}
        onCancel={() => setConfirmProvider(null)}
        onConfirm={() => void saveProvider('TEST')}
      />

      <AdminConfirmDialog
        open={confirmProvider === 'LIVE'}
        title="LIVE Toss 설정을 저장하시겠습니까?"
        description="LIVE 키 변경은 운영 결제 설정에 영향을 줄 수 있습니다. DEVELOPMENT 환경에서는 실제 LIVE 청구는 차단됩니다."
        confirmLabel="저장"
        variant="danger"
        loading={savingProvider === 'LIVE'}
        onCancel={() => setConfirmProvider(null)}
        onConfirm={() => void saveProvider('LIVE')}
      />
    </>
  );
}
