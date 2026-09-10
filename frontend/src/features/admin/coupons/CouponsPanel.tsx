'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import {
  AdminButton,
  AdminFeedback,
  AdminField,
  AdminInput,
  AdminPermissionNotice,
  AdminSelect,
} from '@/src/components/admin/ui';
import styles from '@/src/components/admin/AdminShell.module.css';
import ui from '@/src/components/admin/ui/adminUi.module.css';
import { formatCouponStatus, formatCouponUsageStatus, formatMoneyUsd } from '@/src/features/admin/adminDisplay';
import {
  createAdminCoupon,
  getAdminSession,
  listAdminCoupons,
  listAdminCouponUsages,
  transitionAdminCoupon,
  type AdminCoupon,
  type AdminCouponUsage,
  type AdminSession,
} from '@/src/lib/adminApi';
import { buildCouponPayload, EMPTY_COUPON_DRAFT, type CouponDraft } from './couponForm';

export default function CouponsPanel() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState<CouponDraft>(EMPTY_COUPON_DRAFT);
  const [selected, setSelected] = useState<AdminCoupon | null>(null);
  const [usages, setUsages] = useState<AdminCouponUsage[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'success' | 'error' | 'info'>('info');
  const isSuper = session?.role === 'SUPER_ADMIN';

  useEffect(() => {
    void getAdminSession().then(setSession).catch(() => setSession(null));
  }, []);

  async function reload() {
    const res = await listAdminCoupons({ q: query, status });
    setCoupons(res.coupons);
  }

  useEffect(() => {
    void reload().catch((err) => {
      setTone('error');
      setMessage(err instanceof Error ? err.message : '쿠폰 목록을 불러오지 못했습니다.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    const built = buildCouponPayload(draft);
    if (!built.ok) {
      setTone('error');
      setMessage(built.message);
      return;
    }
    try {
      await createAdminCoupon({ ...built.payload, status: 'ACTIVE' });
      setDraft(EMPTY_COUPON_DRAFT);
      setTone('success');
      setMessage('쿠폰이 생성되었습니다.');
      await reload();
    } catch (err) {
      setTone('error');
      setMessage(err instanceof Error ? err.message : '쿠폰 생성 실패');
    }
  }

  async function handleSelect(coupon: AdminCoupon) {
    setSelected(coupon);
    const res = await listAdminCouponUsages(coupon.id);
    setUsages(res.usages);
  }

  async function handleTransition(action: 'pause' | 'activate' | 'archive') {
    if (!selected) return;
    try {
      const res = await transitionAdminCoupon(selected.id, action);
      setSelected(res.coupon);
      setTone('success');
      setMessage('쿠폰 상태가 변경되었습니다.');
      await reload();
    } catch (err) {
      setTone('error');
      setMessage(err instanceof Error ? err.message : '상태 변경 실패');
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.pageTitle}>초대장 쿠폰</h2>
      <p className={styles.pageDescription}>
        금액은 USD 센트(정수)로 계산됩니다. 사용 횟수는 예약·사용완료 이력 기준이며, 사용 이력이 있으면
        삭제 대신 보관만 가능합니다. 환불 후에도 사용완료는 유지됩니다.
      </p>
      {session && !isSuper ? (
        <AdminPermissionNotice message="쿠폰 생성·상태 변경은 SUPER_ADMIN만 할 수 있습니다." />
      ) : null}
      <AdminFeedback tone={tone} message={message} />

      <div className={ui.formStack} style={{ marginBottom: 16 }}>
        <AdminField label="검색">
          <AdminInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="코드 또는 이름" />
        </AdminField>
        <AdminField label="상태">
          <AdminSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">전체</option>
            <option value="DRAFT">초안</option>
            <option value="ACTIVE">활성</option>
            <option value="PAUSED">일시중지</option>
            <option value="EXPIRED">만료</option>
            <option value="ARCHIVED">보관</option>
          </AdminSelect>
        </AdminField>
        <AdminButton variant="secondary" onClick={() => void reload()}>
          필터 적용
        </AdminButton>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>코드</th>
              <th>이름</th>
              <th>상태</th>
              <th>할인</th>
              <th>사용</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} onClick={() => void handleSelect(coupon)} style={{ cursor: 'pointer' }}>
                <td>{coupon.code}</td>
                <td>{coupon.name}</td>
                <td>{formatCouponStatus(coupon.effectiveStatus)}</td>
                <td>
                  {coupon.discountType === 'PERCENT'
                    ? `${coupon.discountValue}%`
                    : formatMoneyUsd(coupon.discountValue)}
                </td>
                <td>
                  {coupon.activeUsageCount}
                  {coupon.totalUsageLimit != null ? ` / ${coupon.totalUsageLimit}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isSuper ? (
        <article className={styles.card} style={{ marginTop: 20 }}>
          <h3>쿠폰 만들기</h3>
          <div className={ui.formStack}>
            <AdminField label="코드">
              <AdminInput value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
            </AdminField>
            <AdminField label="이름">
              <AdminInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </AdminField>
            <AdminField label="조직">
              <AdminInput
                value={draft.organization}
                onChange={(e) => setDraft({ ...draft, organization: e.target.value })}
              />
            </AdminField>
            <AdminField label="할인 유형">
              <AdminSelect
                value={draft.discountType}
                onChange={(e) =>
                  setDraft({ ...draft, discountType: e.target.value as CouponDraft['discountType'] })
                }
              >
                <option value="PERCENT">정률 (%)</option>
                <option value="FIXED_AMOUNT">정액 (센트)</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="할인 값" helper="정률은 1–100, 정액은 USD 센트(예: 500 = $5)">
              <AdminInput
                value={draft.discountValue}
                onChange={(e) => setDraft({ ...draft, discountValue: e.target.value })}
              />
            </AdminField>
            <AdminField label="계정당 한도" helper="비우면 무제한">
              <AdminInput
                value={draft.perUserUsageLimit}
                onChange={(e) => setDraft({ ...draft, perUserUsageLimit: e.target.value })}
              />
            </AdminField>
            <AdminField label="전체 한도" helper="비우면 무제한">
              <AdminInput
                value={draft.totalUsageLimit}
                onChange={(e) => setDraft({ ...draft, totalUsageLimit: e.target.value })}
              />
            </AdminField>
            <AdminButton variant="primary" onClick={() => void handleCreate()}>
              생성하고 활성화
            </AdminButton>
          </div>
        </article>
      ) : null}

      {selected ? (
        <article className={styles.card} style={{ marginTop: 20 }}>
          <h3>
            {selected.code} · {selected.name}
          </h3>
          <p>
            상태 {formatCouponStatus(selected.effectiveStatus)} · 활성 사용 {selected.activeUsageCount} · 전체
            이력 {selected.totalUsageCount}
          </p>
          {isSuper ? (
            <div className={ui.buttonGroup}>
              <AdminButton variant="secondary" onClick={() => void handleTransition('activate')}>
                활성화
              </AdminButton>
              <AdminButton variant="secondary" onClick={() => void handleTransition('pause')}>
                일시중지
              </AdminButton>
              <AdminButton variant="danger" onClick={() => void handleTransition('archive')}>
                보관
              </AdminButton>
            </div>
          ) : null}
          <div className={styles.tableWrap} style={{ marginTop: 16 }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>상태</th>
                  <th>최종금액</th>
                  <th>초대장</th>
                  <th>결제</th>
                </tr>
              </thead>
              <tbody>
                {usages.map((usage) => (
                  <tr key={usage.id}>
                    <td>{formatCouponUsageStatus(usage.status)}</td>
                    <td>{formatMoneyUsd(usage.finalAmountCents)}</td>
                    <td>{usage.invitationId}</td>
                    <td>{usage.paymentId || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}
