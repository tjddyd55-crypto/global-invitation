'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setStoredSession, signupWithPassword } from '@/src/shared/auth';
import { useAuth } from '@/src/shared/hooks/useAuth';
import { getAuthReturnParam, sanitizeReturnPath } from '@/src/lib/loginRedirect';

export type SignupRole = 'USER' | 'CREATOR';

export interface UseSignupFormResult {
  email: string;
  nickname: string;
  password: string;
  role: SignupRole;
  submitting: boolean;
  error: string | null;
  setEmail: (v: string) => void;
  setNickname: (v: string) => void;
  setPassword: (v: string) => void;
  setRole: (v: SignupRole) => void;
  submit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export interface UseSignupFormOptions {
  /** 가입 후 이동 경로. role 별로 다른 목적지를 지정할 수 있다. */
  redirectByRole: Record<SignupRole, string>;
}

/**
 * 회원가입 폼의 상태/제출을 관리하는 훅.
 * - 초기 role 은 ?role=CREATOR 쿼리로 덮어쓸 수 있다.
 * - 성공 시 redirectByRole 로 이동한다.
 */
function useSignupFields() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SignupRole>('USER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const roleQuery = new URLSearchParams(window.location.search).get('role');
    if (roleQuery?.toUpperCase() === 'CREATOR') {
      setRole('CREATOR');
    }
  }, []);

  return {
    email,
    nickname,
    password,
    role,
    submitting,
    error,
    setEmail,
    setNickname,
    setPassword,
    setRole,
    setSubmitting,
    setError,
  };
}

async function submitSignup(
  event: React.FormEvent<HTMLFormElement>,
  fields: ReturnType<typeof useSignupFields>,
  complete: (role: SignupRole) => Promise<void>,
) {
  event.preventDefault();
  if (fields.submitting) return;
  fields.setSubmitting(true);
  fields.setError(null);
  try {
    const created = await signupWithPassword({
      email: fields.email.trim(),
      nickname: fields.nickname.trim(),
      password: fields.password,
      role: fields.role,
    });
    setStoredSession({ token: created.token, user: created.user });
    await complete(created.user.role === 'CREATOR' ? 'CREATOR' : 'USER');
  } catch (signupError) {
    fields.setError(signupError instanceof Error ? signupError.message : '회원가입에 실패했습니다.');
  } finally {
    fields.setSubmitting(false);
  }
}

export function useSignupForm(options: UseSignupFormOptions): UseSignupFormResult {
  const router = useRouter();
  const { refresh } = useAuth();
  const fields = useSignupFields();
  const complete = useCallback(async (role: SignupRole) => {
    await refresh();
    const returnParam = getAuthReturnParam(new URLSearchParams(window.location.search));
    router.replace(sanitizeReturnPath(returnParam ?? options.redirectByRole[role]));
  }, [refresh, router, options.redirectByRole]);
  const submit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => submitSignup(event, fields, complete),
    [fields, complete],
  );
  return { ...fields, submit };
}

export const CREATOR_BENEFITS = [
  '템플릿 제작 후 마켓에 공개하여 사용될 때마다 수익을 얻습니다.',
  'Creator Dashboard에서 사용량/트렌드/수익 지표를 확인할 수 있습니다.',
  '인기·트렌딩 노출을 통해 신규 사용자 유입을 기대할 수 있습니다.',
];
