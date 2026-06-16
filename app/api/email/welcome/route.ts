import { NextResponse } from 'next/server';
import { renderWelcomeEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/send';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const dashboardUrl = new URL('/dashboard', request.url).toString();
    const html = renderWelcomeEmail(name || 'there', dashboardUrl);

    await sendEmail({
      to: email,
      subject: 'Welcome to Momentum — Let\'s build your momentum',
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[email/welcome]', err);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
