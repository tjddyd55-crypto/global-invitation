'use client';
/* eslint-disable i18next/no-literal-string */

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '@/src/features/admin/AdminPageHeader';
import {
  formatAuditAction,
  formatConfigured,
  formatPaymentChannel,
  formatRuntimeEnv,
} from '@/src/features/admin/adminDisplay';
import {
  getAdminOpsSystem,
  listAdminOpsAudit,
  updateAdminOpsSystem,
  getAdminSession,
  getAdminVisualTemplateDrift,
  adminApiJson,
  testAdminFigmaConnection,
  type AdminSession,
  type AdminVisualCatalogDrift,
} from '@/src/lib/adminApi';
import {
  formatFigmaScopeHelper,
  missingFigmaTokenConnectionResult,
  normalizeFigmaConnectionTestResult,
  type FigmaConnectionResult,
} from '@/src/features/admin/figmaConnectionTest';
import {
  AdminButton,
  AdminFeedback,
  AdminField,
  AdminInput,
  AdminPermissionNotice,
  AdminSelect,
  AdminTabs,
} from '@/src/components/admin/ui';
import ui from '@/src/components/admin/ui/adminUi.module.css';
import styles from '@/src/components/admin/AdminShell.module.css';

export type AdminSystemTab = 'runtime' | 'figma' | 'audit';

type AdminSystemClientProps = {
  initialTab: AdminSystemTab;
};

export default function AdminSystemClient({ initialTab }: AdminSystemClientProps) {
  const router = useRouter();
  const tab = initialTab;
  const [session, setSession] = useState<AdminSession | null>(null);
  const [system, setSystem] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [drift, setDrift] = useState<AdminVisualCatalogDrift | null>(null);
  const [figma, setFigma] = useState<Record<string, unknown> | null>(null);
  const [figmaToken, setFigmaToken] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | 'info'>('info');
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [savingFigma, setSavingFigma] = useState(false);
  const [testingFigma, setTestingFigma] = useState(false);
  const [figmaConnectionResult, setFigmaConnectionResult] = useState<FigmaConnectionResult | null>(
    null
  );

  const isSuper = session?.role === 'SUPER_ADMIN';
  const settings = (system?.settings || {}) as Record<string, unknown>;
  const encryptionConfigured = Boolean(figma?.encryptionConfigured);

  const tabs = useMemo(
    () =>
      [
        { id: 'runtime' as const, label: '운영 설정' },
        { id: 'figma' as const, label: 'Figma 연동' },
        { id: 'audit' as const, label: '관리자 변경 이력' },
      ] as const,
    []
  );

  useEffect(() => {
    void getAdminSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setSessionReady(true));
    void getAdminOpsSystem()
      .then(setSystem)
      .catch((err) => setError(err instanceof Error ? err.message : '시스템 설정 로드 실패'));
    void listAdminOpsAudit(50)
      .then((res) => setLogs(res.logs))
      .catch(() => undefined);
    void getAdminVisualTemplateDrift()
      .then(setDrift)
      .catch(() => undefined);
    void adminApiJson<Record<string, unknown>>('/api/admin/figma/config')
      .then(setFigma)
      .catch(() => undefined);
  }, []);

  function selectTab(next: AdminSystemTab) {
    router.replace(`/admin/system?tab=${next}`, { scroll: false });
  }

  function notify(message: string, tone: 'success' | 'error' | 'info' = 'info') {
    setStatusMsg(message);
    setStatusTone(tone);
  }

  async function checkFigmaConnection() {
    if (!isSuper) return;
    if (testingFigma) return;

    if (!figma?.configured) {
      setFigmaConnectionResult(missingFigmaTokenConnectionResult());
      return;
    }

    setTestingFigma(true);
    setFigmaConnectionResult(null);
    try {
      const { status, payload } = await testAdminFigmaConnection();
      setFigmaConnectionResult(normalizeFigmaConnectionTestResult(status, payload));
    } catch {
      setFigmaConnectionResult(
        normalizeFigmaConnectionTestResult(500, {
          ok: false,
          code: 'FIGMA_TEST_FAILED',
        })
      );
    } finally {
      setTestingFigma(false);
    }
  }

  async function save(patch: Record<string, unknown>) {
    if (!isSuper) {
      setStatusMsg('SUPER_ADMIN 권한이 필요합니다.');
      return;
    }
    try {
      const res = await updateAdminOpsSystem(patch);
      setSystem((prev) => ({ ...(prev || {}), settings: res.settings }));
      setLogs((await listAdminOpsAudit(50)).logs);
      setStatusMsg('저장되었습니다.');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : '저장 실패');
    }
  }

  return (
    <>
      <AdminPageHeader
        breadcrumb={[
          { label: '관리자', href: '/admin/dashboard' },
          { label: '시스템 설정' },
        ]}
        title="시스템 설정"
        description="서비스 운영 상태와 외부 연동 정보를 관리합니다."
      />

      <p className={styles.pageDescription}>
        서비스 환경: {formatRuntimeEnv(String(system?.runtimeEnvironment))} · 결제 방식:{' '}
        {formatPaymentChannel(String(system?.channel || 'INTERNATIONAL_USD'))} · 통화:{' '}
        {String(system?.currency || 'USD')}
      </p>

      <div className={styles.section} style={{ paddingBottom: 12 }}>
        <AdminTabs tabs={tabs} active={tab} onChange={selectTab} />
      </div>

      {error ? <AdminFeedback tone="error" message={error} /> : null}
      {statusMsg ? <AdminFeedback tone={statusTone} message={statusMsg} /> : null}

      {tab === 'runtime' && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>운영 설정</h2>
          {(
            [
              ['paymentsEnabled', '결제 기능'],
              ['publishingEnabled', '초대장 공개'],
              ['invitationCreationEnabled', '신규 초대장 생성'],
              ['signupsEnabled', '신규 회원가입'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} style={{ display: 'block', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                disabled={!isSuper}
                onChange={(e) => void save({ [key]: e.target.checked })}
              />{' '}
              {label}
            </label>
          ))}
          <label>
            고객지원 이메일
            <input
              className={styles.input}
              defaultValue={String(settings.supportEmail || '')}
              disabled={!isSuper}
              onBlur={(e) => void save({ supportEmail: e.target.value.trim() || null })}
            />
          </label>
          <label>
            현재 결제 환경
            <select
              className={styles.input}
              value={String(settings.activePaymentEnvironment || 'TEST')}
              disabled={!isSuper}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'LIVE') {
                  if (
                    !window.confirm(
                      '현재 development 환경입니다. LIVE 결제를 활성화하면 실제 청구가 발생할 수 있습니다. (실제 charge는 여전히 차단됩니다)'
                    )
                  ) {
                    return;
                  }
                  void save({ activePaymentEnvironment: 'LIVE', confirmLiveActivation: true });
                } else {
                  void save({ activePaymentEnvironment: 'TEST' });
                }
              }}
            >
              <option value="TEST">TEST</option>
              <option value="LIVE">LIVE</option>
            </select>
          </label>

          {drift && (
            <div style={{ marginTop: 24 }}>
              <h3 className={styles.pageTitle}>비주얼 템플릿 카탈로그 Drift</h3>
              <div className={styles.grid}>
                {[
                  ['Registry', drift.registryTemplateCount],
                  ['Catalog DB', drift.catalogEntryCount],
                  ['Active+Visible', drift.activeVisibleCount],
                  ['Missing in DB', drift.registryMissingCount],
                  ['Orphan in DB', drift.dbOrphanCount],
                ].map(([label, value]) => (
                  <article key={String(label)} className={styles.card}>
                    <div className={styles.metricLabel}>{label}</div>
                    <p className={styles.metricValue}>{value}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'figma' && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>Figma 연동 설정</h2>
          <p className={styles.pageDescription}>
            Token: {formatConfigured(figma?.configured as boolean | string | null | undefined)} · source:{' '}
            {String(figma?.source || '—')} · masked: {String(figma?.tokenMasked || '—')}
          </p>
          {!figma?.configured ? (
            <p className={styles.pageDescription}>
              Figma 연동 정보가 없습니다. 실 Figma Frame을 가져오려면 Access Token 설정이
              필요합니다.
            </p>
          ) : null}
          {sessionReady && !isSuper ? (
            <AdminPermissionNotice message="Figma Token 저장은 SUPER_ADMIN 권한에서만 가능합니다." />
          ) : null}
          {!encryptionConfigured ? (
            <AdminFeedback
              tone="error"
              message="암호화 키가 설정되지 않았습니다. Token 저장은 ADMIN_SETTINGS_ENCRYPTION_KEY 설정 후 가능합니다. 입력은 가능하며 저장 시 안내가 표시됩니다."
            />
          ) : null}
          <AdminField
            label="필요한 권한"
            helper="연결 확인은 runtime Figma REST import와 동일한 file API 기준입니다. current_user:read는 필요하지 않습니다."
          >
            <p className={styles.pageDescription} style={{ whiteSpace: 'pre-line', margin: 0 }}>
              {formatFigmaScopeHelper()}
            </p>
          </AdminField>
          <p className={styles.helperText}>
            Cursor Figma MCP와 별개로, 여기서 설정하는 PAT는 Admin runtime REST API용입니다.
            연결 확인은 DB에 저장된 토큰 기준으로 수행합니다.
          </p>
          <div className={ui.formStack}>
            <AdminField
              label="Figma Access Token"
              helper="기존 값을 변경하지 않으려면 입력하지 마세요."
            >
              <AdminInput
                type="password"
                value={figmaToken}
                onChange={(e) => {
                  setFigmaToken(e.target.value);
                  setFigmaConnectionResult(null);
                }}
                placeholder="figd_…"
                readOnly={sessionReady && !isSuper}
              />
            </AdminField>
            <div className={ui.buttonGroup}>
              <AdminButton
                variant="primary"
                disabled={!isSuper || testingFigma}
                loading={savingFigma}
                onClick={() => {
                  if (!isSuper) {
                    notify('SUPER_ADMIN 권한이 필요합니다.', 'error');
                    return;
                  }
                  if (figmaToken.trim() && !encryptionConfigured) {
                    notify(
                      '암호화 설정이 없어 Token을 저장할 수 없습니다. Railway Backend의 ADMIN_SETTINGS_ENCRYPTION_KEY 설정을 확인해 주세요.',
                      'error'
                    );
                    return;
                  }
                  setSavingFigma(true);
                  void adminApiJson('/api/admin/figma/config', {
                    method: 'PUT',
                    body: JSON.stringify({ accessToken: figmaToken }),
                  })
                    .then((view) => {
                      setFigma(view as Record<string, unknown>);
                      setFigmaToken('');
                      setFigmaConnectionResult(null);
                      notify('Figma 토큰이 저장되었습니다.', 'success');
                    })
                    .catch((err) =>
                      notify(err instanceof Error ? err.message : '저장 실패', 'error')
                    )
                    .finally(() => setSavingFigma(false));
                }}
              >
                저장
              </AdminButton>
              <AdminButton
                variant="secondary"
                disabled={!isSuper || savingFigma || testingFigma}
                loading={testingFigma}
                onClick={() => void checkFigmaConnection()}
              >
                {testingFigma ? '연결 확인 중...' : '연결 확인'}
              </AdminButton>
            </div>
            {figmaConnectionResult ? (
              <AdminFeedback
                tone={figmaConnectionResult.type === 'success' ? 'success' : 'error'}
                message={figmaConnectionResult.message}
              />
            ) : null}
          </div>
        </section>
      )}

      {tab === 'audit' && (
        <section className={styles.section}>
          <h2 className={styles.pageTitle}>관리자 변경 이력</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>일시</th>
                  <th>관리자</th>
                  <th>작업</th>
                  <th>대상</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={String(log.id)}>
                    <td>{String(log.createdAt)}</td>
                    <td>{String(log.adminId)}</td>
                    <td>{formatAuditAction(String(log.action))}</td>
                    <td>
                      {String(log.targetType)} {String(log.targetId || '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
