/**
 * Mailer – 이메일 발송.
 *
 * 개발(로컬) 우선:
 * - EMAIL_PROVIDER=mock 또는 NODE_ENV !== production 이면 실발송하지 않고 로그로 대체한다.
 * - 운영에서는 EMAIL_PROVIDER=smtp + EMAIL_ENABLED=true 일 때만 실발송 경로를 탄다.
 */

type MagicLinkEmailParams = {
  to: string;
  link: string;
};

type VerificationCodeEmailParams = {
  to: string;
  code: string;
  expiresMinutes?: number;
};

function resolveServiceName(): string {
  return process.env.SERVICE_NAME || process.env.NEXT_PUBLIC_SERVICE_NAME || 'Global Invitation';
}

/** mock 우선. production + smtp 설정이 있을 때만 실발송 후보. */
export function isEmailMockMode(): boolean {
  const provider = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (provider === 'mock') return true;
  if (provider === 'smtp' && process.env.EMAIL_ENABLED === 'true') return false;
  return process.env.NODE_ENV !== 'production';
}

/** UI previewCode 노출 허용 여부. production 에서는 절대 true 가 되면 안 된다. */
export function shouldExposeEmailPreviewCode(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return isEmailMockMode();
}

/**
 * 매직 링크 이메일 발송.
 * MVP: 실제 발송 없이 스텁. 추후 EMAIL_ENABLED + nodemailer 연동 시 구현.
 */
export async function sendMagicLinkEmail({ to, link }: MagicLinkEmailParams): Promise<boolean> {
  console.warn('Email feature disabled (MVP). Magic link not sent.', { to, linkLength: link?.length ?? 0 });
  return Promise.resolve(false);
}

/**
 * 6자리 이메일 인증번호 발송.
 * mock/dev: console 출력 후 false 반환 (호출측이 previewCode 를 내릴 수 있음).
 * production smtp: 추후 true 반환하도록 확장.
 */
export async function sendVerificationCodeEmail({
  to,
  code,
  expiresMinutes = 10,
}: VerificationCodeEmailParams): Promise<boolean> {
  const serviceName = resolveServiceName();
  const subject = `[${serviceName}] 인증번호 안내`;
  const body = `인증번호는 ${code} 입니다.\n${expiresMinutes}분 안에 입력해 주세요.`;

  if (isEmailMockMode()) {
    console.info(`[mailer:mock] verification code for ${to}: ${code} (expires ${expiresMinutes}m)`);
    console.info(`[mailer:mock] subject=${subject}`);
    console.info(`[mailer:mock] body=\n${body}`);
    return Promise.resolve(false);
  }

  // TODO: SMTP/nodemailer 연동.
  console.warn('EMAIL_PROVIDER=smtp but transport is not configured yet.', { to, subject });
  console.info(`[mailer] verification code for ${to}: ${code} (expires ${expiresMinutes}m)`);
  return Promise.resolve(false);
}
