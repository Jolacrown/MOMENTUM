import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/email/send';
import { renderPremiumConfirmationEmail } from '@/lib/email/templates';

export async function POST(request: Request) {
  try {
    const { transactionId, userId, email: bodyEmail, name: bodyName } = await request.json();

    if (!transactionId || !userId) {
      return NextResponse.json({ error: 'Transaction ID and userId are required' }, { status: 400 });
    }

    const secretKey = process.env.FLW_SECRET_KEY;

    if (!secretKey || secretKey === 'FLWSECK_TEST-xxxxxxxx-X') {
      return NextResponse.json({ error: 'Flutterwave secret key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Verification failed: ${errorText}` }, { status: 502 });
    }

    const data = await response.json();

    if (data.status !== 'success' || data.data.status !== 'successful') {
      return NextResponse.json({ verified: false, error: 'Transaction not successful' }, { status: 400 });
    }

    const verifiedAmount = data.data.amount;
    const currency = data.data.currency;

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ is_premium: true, premium_since: new Date().toISOString() })
      .eq('id', userId);

    if (dbError) {
      console.error('Failed to update user premium in DB:', dbError);
    }

    let authError: { message: string } | null = null;

    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { app_metadata: { isPremium: true }, user_metadata: { isPremium: true } }
      );
      authError = error;
      if (authError) console.error('Failed to update auth metadata:', authError);
    } catch (e) {
      authError = { message: e instanceof Error ? e.message : 'update failed' };
      console.error('Auth metadata update threw:', authError);
    }

    if (bodyEmail) {
      const profileUrl = new URL('/profile', request.url).toString();
      const html = renderPremiumConfirmationEmail(bodyName || 'there', profileUrl);
      sendEmail({
        to: bodyEmail,
        subject: 'You\'re now a Momentum Premium member!',
        html,
      }).catch((err) => console.error('[verify] Failed to send premium email:', err));
    }

    if (dbError || authError) {
      return NextResponse.json({
        verified: true,
        upgraded: false,
        error: 'Premium status saved but metadata update failed. Please contact support.',
        amount: verifiedAmount,
        currency,
        transactionId: data.data.id,
      });
    }

    return NextResponse.json({
      verified: true,
      upgraded: true,
      amount: verifiedAmount,
      currency,
      transactionId: data.data.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
