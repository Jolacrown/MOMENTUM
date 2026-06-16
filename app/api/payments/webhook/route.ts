import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email/send';
import { renderPremiumConfirmationEmail } from '@/lib/email/templates';

export async function POST(request: Request) {
  try {
    const secretHash = process.env.FLW_SECRET_HASH;

    if (!secretHash) {
      console.error('FLW_SECRET_HASH not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const signature = request.headers.get('flutterwave-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const body = await request.text();

    const expectedSignature = crypto
      .createHmac('sha256', secretHash)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.completed' && event.data?.status === 'successful') {
      const userId = event.data?.meta?.userId;
      const txRef = event.data?.tx_ref;

      if (!userId || !txRef?.startsWith('MOMENTUM-PREMIUM-')) {
        return NextResponse.json({ status: 'ignored' });
      }

      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update({ is_premium: true, premium_since: new Date().toISOString() })
        .eq('id', userId);

      if (dbError) {
        console.error('Webhook: Failed to update user premium:', dbError);
      }

      try {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { app_metadata: { isPremium: true }, user_metadata: { isPremium: true } }
        );

        if (authError) {
          console.error('Webhook: Failed to update auth metadata:', authError);
        }
      } catch (e) {
        console.error('Webhook: Auth metadata update threw:', e);
      }

      const customerEmail = event.data?.customer?.email;
      const customerName = event.data?.customer?.name || 'there';

      if (customerEmail) {
        const profileUrl = new URL('/profile', request.url).toString();
        const html = renderPremiumConfirmationEmail(customerName, profileUrl);
        sendEmail({
          to: customerEmail,
          subject: 'You\'re now a Momentum Premium member!',
          html,
        }).catch((err) => console.error('[webhook] Failed to send premium email:', err));
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
