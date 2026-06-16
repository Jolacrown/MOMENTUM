import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { renderWelcomeEmail, renderPremiumConfirmationEmail } from '@/lib/email/templates';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'test@example.com';
    const name = searchParams.get('name') || 'Test User';
    const type = searchParams.get('type') || 'welcome';

    const templates: Record<string, { subject: string; html: string }> = {
      welcome: {
        subject: 'Welcome to Momentum — Test',
        html: renderWelcomeEmail(name, 'http://localhost:3000/dashboard'),
      },
      premium: {
        subject: 'You\'re now Premium! — Test',
        html: renderPremiumConfirmationEmail(name, 'http://localhost:3000/profile'),
      },
    };

    const template = templates[type] || templates.welcome;

    console.log(`[email/test] Sending ${type} email to ${email}...`);

    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    return NextResponse.json({ sent: true, to: email, type });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send failed';
    console.error('[email/test]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
