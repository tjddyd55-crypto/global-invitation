'use client';
/* eslint-disable i18next/no-literal-string */

import { useState } from 'react';
import styles from '@/src/components/admin/AdminShell.module.css';
import { postSuperBulkGrant } from '@/src/lib/superAdminApi';

export default function SuperBulkGrantPage() {
  const [country, setCountry] = useState('');
  const [registeredAfter, setRegisteredAfter] = useState('');
  const [registeredBefore, setRegisteredBefore] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || !reason.trim()) {
      setError('지급액(양수)과 사유는 필수입니다.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const out = await postSuperBulkGrant({
        country: country.trim() || null,
        registeredAfter: registeredAfter.trim() || null,
        registeredBefore: registeredBefore.trim() || null,
        amount: Math.trunc(n),
        reason: reason.trim(),
      });
      setMessage(`처리 완료: ${out.affected}명`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '실행 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h1 className={styles.pageTitle}>Bulk Grant</h1>
      <p className={styles.pageDescription}>
        조건에 맞는 사용자(최대 500명)에게 동일 크레딧을 지급합니다. country는 users.country_code와 일치해야 합니다.
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}

      <div className={`${styles.form} max-w-xl`}>
        <label className={styles.field}>
          <span>country (선택, country_code)</span>
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="예: KR" />
        </label>
        <label className={styles.field}>
          <span>가입일 이후 (선택, ISO 날짜/시간)</span>
          <input
            type="datetime-local"
            value={registeredAfter}
            onChange={(e) => setRegisteredAfter(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>가입일 이전 (선택)</span>
          <input
            type="datetime-local"
            value={registeredBefore}
            onChange={(e) => setRegisteredBefore(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>지급 크레딧 (양수)</span>
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>사유</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button type="button" className={styles.button} disabled={loading} onClick={() => void run()}>
          {loading ? '실행 중…' : '실행'}
        </button>
      </div>
    </section>
  );
}
