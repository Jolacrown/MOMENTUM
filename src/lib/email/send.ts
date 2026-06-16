import nodemailer from 'nodemailer';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return { host, port, user, pass };
  }
  return null;
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const config = getSmtpConfig();

  if (config) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
    return cachedTransporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  console.log('[email] No SMTP configured. Using Ethereal test account.');
  console.log('[email] View captured emails at:', `https://ethereal.email/login?userName=${testAccount.user}`);

  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  return cachedTransporter;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const fromName = process.env.EMAIL_FROM_NAME || 'Momentum';
  const fromEmail = process.env.EMAIL_FROM || 'noreply@momentum.local';

  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });

  const testUrl = nodemailer.getTestMessageUrl(info);
  if (testUrl) {
    console.log('[email] Preview URL:', testUrl);
  }

  return info;
}
