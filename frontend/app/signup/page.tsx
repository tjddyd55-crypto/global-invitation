'use client';
/* eslint-disable i18next/no-literal-string */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MarketingLayout from '@/src/components/MarketingLayout';
import { setStoredSession, signupWithPassword } from '@/src/lib/auth';
import styles from './signup.module.css';

type SignupRole = 'USER' | 'CREATOR';

const CREATOR_BENEFITS = [
  '템플릿 제작 후 마켓에 공개하여 사용될 때마다 수익을 얻습니다.',
  'Creator Dashboard에서 사용량/트렌드/수익 지표를 확인할 수 있습니다.',
  '인기·트렌딩 노출을 통해 신규 사용자 유입을 기대할 수 있습니다.',
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRole>('USER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const roleQuery = new URLSearchParams(window.location.search).get('role');
    if (roleQuery?.toUpperCase() === 'CREATOR') {
      setRole('CREATOR');
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await signupWithPassword({
        email: email.trim(),
        nickname: nickname.trim(),
        password,
        role,
      });
      setStoredSession({
        token: created.token,
        user: created.user,
      });
      if (created.user.role === 'CREATOR') {
        router.replace('/creator/dashboard');
        return;
      }
      router.replace('/templates');
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketingLayout>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>회원가입</h1>
          <p className={styles.subtitle}>가입 유형을 선택하고 1분 안에 시작하세요.</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label}>
              이메일
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </label>

            <label className={styles.label}>
              닉네임
              <input
                className={styles.input}
                type="text"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="표시될 닉네임"
                maxLength={40}
              />
            </label>

            <label className={styles.label}>
              비밀번호
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8자 이상 입력"
                minLength={8}
                required
              />
            </label>

            <fieldset className={styles.roleFieldset}>
              <legend className={styles.legend}>가입 유형</legend>
              <label
                className={
                  role === 'USER' ? `${styles.roleOption} ${styles.roleOptionActive}` : styles.roleOption
                }
              >
                <input
                  type="radio"
                  name="signup-role"
                  value="USER"
                  checked={role === 'USER'}
                  onChange={() => setRole('USER')}
                />
                <span>
                  <strong>일반 사용자</strong>
                  <em>템플릿을 선택하고 바로 초대장을 제작합니다.</em>
                </span>
              </label>
              <label
                className={
                  role === 'CREATOR'
                    ? `${styles.roleOption} ${styles.roleOptionActive}`
                    : styles.roleOption
                }
              >
                <input
                  type="radio"
                  name="signup-role"
                  value="CREATOR"
                  checked={role === 'CREATOR'}
                  onChange={() => setRole('CREATOR')}
                />
                <span>
                  <strong>크리에이터</strong>
                  <em>직접 만든 템플릿을 공개하고 수익을 창출합니다.</em>
                </span>
              </label>
            </fieldset>

            <div
              className={
                role === 'CREATOR'
                  ? `${styles.creatorInfo} ${styles.creatorInfoActive}`
                  : styles.creatorInfo
              }
            >
              <p className={styles.creatorHeadline}>
                크리에이터는 템플릿을 제작하여
                <br />
                사용자가 사용할 때마다 수익을 얻을 수 있습니다.
              </p>
              <ul className={styles.creatorBenefitList}>
                {CREATOR_BENEFITS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitButton} type="submit" disabled={submitting}>
              {submitting ? '가입 처리 중...' : '가입하기'}
            </button>
          </form>
        </div>
      </div>
    </MarketingLayout>
  );
}
