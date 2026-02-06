import nodemailer from 'nodemailer';

type MagicLinkEmailParams = {
  to: string;
  link: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from };
}

export async function sendMagicLinkEmail({ to, link }: MagicLinkEmailParams): Promise<boolean> {
  const config = getSmtpConfig();
  if (!config) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject: 'Global Invitation 로그인 링크',
    text: `아래 링크를 클릭해 로그인하세요.\n\n${link}\n\n이 링크는 30분 동안 유효합니다.`,
  });

  return true;
}
