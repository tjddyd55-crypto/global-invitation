/**
 * Mailer – 이메일 발송 (추후 확장용)
 * 현재는 서버 안정성 우선으로 비활성화. nodemailer 의존성 없음.
 */

type MagicLinkEmailParams = {
  to: string;
  link: string;
};

/**
 * 매직 링크 이메일 발송.
 * MVP: 실제 발송 없이 스텁. 추후 EMAIL_ENABLED + nodemailer 연동 시 구현.
 */
export async function sendMagicLinkEmail({ to, link }: MagicLinkEmailParams): Promise<boolean> {
  console.warn('Email feature disabled (MVP). Magic link not sent.', { to, linkLength: link?.length ?? 0 });
  return Promise.resolve(false);
}
