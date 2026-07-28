/**
 * Mailer – 이메일 발송.
 *
 * - EMAIL_PROVIDER=mock (기본): 실발송 없음
 * - EMAIL_PROVIDER=smtp + EMAIL_ENABLED=true + SMTP_* : nodemailer 실발송
 * - previewCode 노출은 canExposeEmailPreviewCode() SSOT (로그·health 미포함)
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

type MagicLinkEmailParams = {
  to: string;
  link: string;
};

type VerificationCodeEmailParams = {
  to: string;
  code: string;
  expiresMinutes?: number;
};

export type EmailDiagnostics = {
  provider: string;
  mockMode: boolean;
  emailEnabled: boolean;
  smtpConfigured: boolean;
  frontendUrlConfigured: boolean;
  fromConfigured: boolean;
};

let cachedTransporter: Transporter | null = null;

function resolveServiceName(): string {
  return process.env.SERVICE_NAME || process.env.NEXT_PUBLIC_SERVICE_NAME || 'Global Invitation';
}

function resolveSmtpFrom(): string {
  return (process.env.SMTP_FROM || process.env.EMAIL_FROM || '').trim();
}

function hasSmtpCredentials(): boolean {
  return Boolean(
    (process.env.SMTP_HOST || '').trim() &&
      (process.env.SMTP_USER || '').trim() &&
      (process.env.SMTP_PASSWORD || '').trim() &&
      resolveSmtpFrom()
  );
}

/** mock 우선. smtp + EMAIL_ENABLED=true 일 때만 실발송 후보. */
export function isEmailMockMode(): boolean {
  const provider = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (provider === 'mock') return true;
  if (provider === 'smtp' && process.env.EMAIL_ENABLED === 'true') return false;
  return process.env.NODE_ENV !== 'production';
}

/**
 * 개발용 OTP previewCode 노출 SSOT.
 * production / 실 SMTP / EMAIL_ENABLED=true 에서는 절대 true 가 되면 안 된다.
 * Frontend NEXT_PUBLIC·hostname·query 로는 판단하지 않는다.
 */
export function canExposeEmailPreviewCode(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    (process.env.EMAIL_PROVIDER || '').trim().toLowerCase() === 'mock' &&
    process.env.EMAIL_ENABLED !== 'true' &&
    process.env.ALLOW_EMAIL_PREVIEW_CODE === 'true'
  );
}

/** @deprecated use canExposeEmailPreviewCode */
export function shouldExposeEmailPreviewCode(): boolean {
  return canExposeEmailPreviewCode();
}

export function getEmailDiagnostics(): EmailDiagnostics {
  const provider = (process.env.EMAIL_PROVIDER || 'mock').trim().toLowerCase() || 'mock';
  return {
    provider,
    mockMode: isEmailMockMode(),
    emailEnabled: process.env.EMAIL_ENABLED === 'true',
    smtpConfigured: hasSmtpCredentials(),
    frontendUrlConfigured: Boolean((process.env.FRONTEND_URL || '').trim()),
    fromConfigured: Boolean(resolveSmtpFrom()),
  };
}

function createSmtpTransporter(): Transporter {
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || '587');
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASSWORD || '').trim();
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    auth: { user, pass },
  });
}

function getSmtpTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = createSmtpTransporter();
  }
  return cachedTransporter;
}

/**
 * 매직 링크 이메일 발송.
 * OTP 경로와 동일하게 mock / smtp 분기를 따른다.
 */
export async function sendMagicLinkEmail({ to, link }: MagicLinkEmailParams): Promise<boolean> {
  const serviceName = resolveServiceName();
  const subject = `[${serviceName}] 로그인 링크`;
  const body = `아래 링크로 로그인해 주세요.\n\n${link}\n`;

  if (isEmailMockMode()) {
    console.warn('Email feature mock. Magic link not sent.', { to, linkLength: link?.length ?? 0 });
    return false;
  }

  if (!hasSmtpCredentials()) {
    console.warn('EMAIL_PROVIDER=smtp but SMTP credentials are incomplete.', { to });
    return false;
  }

  try {
    await getSmtpTransporter().sendMail({
      from: resolveSmtpFrom(),
      to,
      subject,
      text: body,
    });
    return true;
  } catch (error) {
    console.error('Failed to send magic link email:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * 6자리 이메일 인증번호 발송.
 * mock: 실발송 없이 false 반환 (호출측이 canExpose 시 previewCode 가능).
 * 원문 인증번호는 서버 로그에 출력하지 않는다.
 * smtp: 실발송 성공 시 true.
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
    console.info(
      `[mailer:mock] verification code issued for ${to} (expires ${expiresMinutes}m, code redacted)`
    );
    return false;
  }

  if (!hasSmtpCredentials()) {
    console.warn('EMAIL_PROVIDER=smtp but SMTP credentials are incomplete.', {
      to,
      hasHost: Boolean((process.env.SMTP_HOST || '').trim()),
      hasUser: Boolean((process.env.SMTP_USER || '').trim()),
      hasPassword: Boolean((process.env.SMTP_PASSWORD || '').trim()),
      hasFrom: Boolean(resolveSmtpFrom()),
    });
    return false;
  }

  try {
    await getSmtpTransporter().sendMail({
      from: resolveSmtpFrom(),
      to,
      subject,
      text: body,
    });
    console.info(`[mailer:smtp] verification code delivered (expires ${expiresMinutes}m)`);
    return true;
  } catch (error) {
    console.error('Failed to send verification code email:', error instanceof Error ? error.message : error);
    return false;
  }
}
