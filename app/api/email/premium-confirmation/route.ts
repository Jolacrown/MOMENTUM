import { NextResponse } from 'next/server';
import { renderPremiumConfirmationEmail } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/send';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const profileUrl = new URL('/profile', request.url).toString();
    const html = renderPremiumConfirmationEmail(name || 'there', profileUrl);

    await sendEmail({
      to: email,
      subject: 'You\'re now a Momentum Premium member!',
      html,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[email/premium-confirmation]', err);
    return NextResponse.json({ error: 'Failed to send premium confirmation email' }, { status: 500 });
  }
}
