'use client';
/* eslint-disable i18next/no-literal-string */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { SUPPORT_EMAIL, supportMailtoHref } from '@/src/shared/marketing/supportContact';
import { resolveAuthNextPath } from '@/src/features/auth/model/authNextPath';
import { useLoginForm } from '@/src/features/auth/model/useLoginForm';
import { usePasswordSignupForm } from '@/src/features/auth/model/usePasswordSignupForm';
import { useForgotPasswordForm } from '@/src/features/auth/model/useForgotPasswordForm';
import { useResetPasswordForm } from '@/src/features/auth/model/useResetPasswordForm';
import AuthFormLayout from './AuthFormLayout';
import RecoveryCodeDisplay from './RecoveryCodeDisplay';
import formStyles from './AuthFormFields.module.css';

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveAuthNextPath(searchParams.get('next'));
  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;
  const forgotHref = `/forgot-password?next=${encodeURIComponent(nextPath)}`;
  const { username, password, submitting, error, setUsername, setPassword, submit } = useLoginForm();

  return (
    <AuthFormLayout
      title="로그인"
      subtitle="아이디와 비밀번호로 로그인하세요."
      footer={
        <p>
          계정이 없으신가요? <Link href={signupHref}>회원가입</Link>
          <br />
          <Link href={forgotHref}>비밀번호를 잊으셨나요?</Link>
        </p>
      }
    >
      <form className={formStyles.form} onSubmit={submit}>
        <label className={formStyles.label}>
          아이디
          <input
            className={formStyles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className={formStyles.label}>
          비밀번호
          <input
            className={formStyles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className={formStyles.error}>{error}</p>}
        <button className={formStyles.submitButton} type="submit" disabled={submitting}>
          {submitting ? '로그인 처리 중...' : '로그인'}
        </button>
      </form>
    </AuthFormLayout>
  );
}

export function SignupScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveAuthNextPath(searchParams.get('next'));
  const form = usePasswordSignupForm(() => router.replace(nextPath));

  if (form.step === 'recovery-code' && form.recoveryCode) {
    return (
      <RecoveryCodeDisplay
        recoveryCode={form.recoveryCode}
        title="계정이 생성되었습니다."
        description="비밀번호를 잊었을 때 사용할 복구코드입니다."
        warning="이 코드는 지금 한 번만 표시됩니다. 안전한 곳에 저장해 주세요."
        onConfirm={form.confirmRecoverySaved}
      />
    );
  }

  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <AuthFormLayout
      title="계정 만들기"
      subtitle="아이디, 이메일, 비밀번호로 가입합니다."
      footer={
        <p>
          이미 계정이 있나요? <Link href={loginHref}>로그인</Link>
        </p>
      }
    >
      <form className={formStyles.form} onSubmit={form.submit}>
        <label className={formStyles.label}>
          아이디
          <input
            className={formStyles.input}
            type="text"
            value={form.username}
            onChange={(e) => form.setUsername(e.target.value)}
            autoComplete="username"
            minLength={4}
            maxLength={30}
            required
          />
        </label>
        <label className={formStyles.label}>
          이메일
          <input
            className={formStyles.input}
            type="email"
            value={form.email}
            onChange={(e) => form.setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className={formStyles.label}>
          비밀번호
          <input
            className={formStyles.input}
            type="password"
            value={form.password}
            onChange={(e) => form.setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className={formStyles.label}>
          비밀번호 확인
          <input
            className={formStyles.input}
            type="password"
            value={form.passwordConfirm}
            onChange={(e) => form.setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {form.error && <p className={formStyles.error}>{form.error}</p>}
        <button className={formStyles.submitButton} type="submit" disabled={form.submitting}>
          {form.submitting ? '가입 처리 중...' : '회원가입'}
        </button>
      </form>
    </AuthFormLayout>
  );
}

export function ForgotPasswordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = resolveAuthNextPath(searchParams.get('next'));
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const form = useForgotPasswordForm(() => router.replace(loginHref));

  if (form.step === 'new-recovery-code' && form.newRecoveryCode) {
    return (
      <RecoveryCodeDisplay
        recoveryCode={form.newRecoveryCode}
        title="비밀번호가 변경되었습니다."
        description="새 복구코드:"
        warning="이전 복구코드는 더 이상 사용할 수 없습니다. 새 코드를 안전한 곳에 저장해 주세요."
        onConfirm={form.finish}
      />
    );
  }

  if (form.step === 'reset') {
    return (
      <AuthFormLayout title="새 비밀번호 설정" subtitle="새 비밀번호를 입력해 주세요.">
        <form className={formStyles.form} onSubmit={form.reset}>
          <label className={formStyles.label}>
            새 비밀번호
            <input
              className={formStyles.input}
              type="password"
              value={form.newPassword}
              onChange={(e) => form.setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className={formStyles.label}>
            새 비밀번호 확인
            <input
              className={formStyles.input}
              type="password"
              value={form.newPasswordConfirm}
              onChange={(e) => form.setNewPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          {form.error && <p className={formStyles.error}>{form.error}</p>}
          <button className={formStyles.submitButton} type="submit" disabled={form.submitting}>
            {form.submitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </AuthFormLayout>
    );
  }

  return (
    <AuthFormLayout
      title="비밀번호 찾기"
      subtitle="가입한 아이디, 이메일, 복구코드를 입력해 주세요."
      footer={
        <p>
          복구코드를 분실하셨나요? 관리자에게 문의해 주세요.
          <br />
          가입한 아이디와 이메일을 준비해 주세요.
          <br />
          <a href={supportMailtoHref('비밀번호 복구 문의')}>{SUPPORT_EMAIL}</a>
          <br />
          <Link href={loginHref}>로그인으로 돌아가기</Link>
        </p>
      }
    >
      <form className={formStyles.form} onSubmit={form.verify}>
        <label className={formStyles.label}>
          아이디
          <input
            className={formStyles.input}
            type="text"
            value={form.username}
            onChange={(e) => form.setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className={formStyles.label}>
          이메일
          <input
            className={formStyles.input}
            type="email"
            value={form.email}
            onChange={(e) => form.setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className={formStyles.label}>
          복구코드
          <input
            className={formStyles.input}
            type="text"
            value={form.recoveryCode}
            onChange={(e) => form.setRecoveryCode(e.target.value)}
            autoComplete="off"
            required
          />
        </label>
        {form.error && <p className={formStyles.error}>{form.error}</p>}
        <button className={formStyles.submitButton} type="submit" disabled={form.submitting}>
          {form.submitting ? '확인 중...' : '확인'}
        </button>
      </form>
    </AuthFormLayout>
  );
}

export function ResetPasswordScreen({ token }: { token: string }) {
  const router = useRouter();
  const form = useResetPasswordForm(token, () => router.replace('/login'));

  useEffect(() => {
    void form.validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validate once on mount
  }, [token]);

  if (form.validating) {
    return (
      <AuthFormLayout title="비밀번호 재설정">
        <p className={formStyles.hint}>링크를 확인하는 중...</p>
      </AuthFormLayout>
    );
  }

  if (!form.tokenValid) {
    return (
      <AuthFormLayout title="비밀번호 재설정">
        <p className={formStyles.error}>{form.error || '링크가 유효하지 않습니다.'}</p>
        <p className={formStyles.hint}>
          <Link href="/login">로그인으로 돌아가기</Link>
        </p>
      </AuthFormLayout>
    );
  }

  if (form.step === 'new-recovery-code' && form.newRecoveryCode) {
    return (
      <RecoveryCodeDisplay
        recoveryCode={form.newRecoveryCode}
        title="비밀번호가 변경되었습니다."
        description="새 복구코드:"
        warning="이전 복구코드는 더 이상 사용할 수 없습니다. 새 코드를 안전한 곳에 저장해 주세요."
        onConfirm={form.finish}
      />
    );
  }

  return (
    <AuthFormLayout title="비밀번호 재설정" subtitle="새 비밀번호를 입력해 주세요.">
      <form className={formStyles.form} onSubmit={form.submit}>
        <label className={formStyles.label}>
          새 비밀번호
          <input
            className={formStyles.input}
            type="password"
            value={form.newPassword}
            onChange={(e) => form.setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className={formStyles.label}>
          새 비밀번호 확인
          <input
            className={formStyles.input}
            type="password"
            value={form.newPasswordConfirm}
            onChange={(e) => form.setNewPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {form.error && <p className={formStyles.error}>{form.error}</p>}
        <button className={formStyles.submitButton} type="submit" disabled={form.submitting}>
          {form.submitting ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </AuthFormLayout>
  );
}
