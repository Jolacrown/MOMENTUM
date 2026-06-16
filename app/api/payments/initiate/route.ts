import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json({ error: 'Email and userId are required' }, { status: 400 });
    }

    const secretKey = process.env.FLW_SECRET_KEY;

    if (!secretKey || secretKey === 'FLWSECK_TEST-xxxxxxxx-X') {
      return NextResponse.json({ error: 'Flutterwave secret key not configured' }, { status: 500 });
    }

    const txRef = `MOMENTUM-PREMIUM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const redirectUrl = new URL('/upgrade', request.url);
    redirectUrl.searchParams.set('tx_ref', txRef);

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: 1_200,
        currency: 'NGN',
        redirect_url: redirectUrl.toString(),
        customer: { email, name: name || email.split('@')[0] },
        customizations: {
          title: 'Momentum Premium',
          description: 'Unlock unlimited goals, AI coaching & more',
          logo: 'https://ejxcefkopuzbdqlckrxv.supabase.co/storage/v1/object/public/assets/logo.png',
        },
        meta: { userId },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Payment initiation failed: ${errorText}` }, { status: 502 });
    }

    const data = await response.json();

    if (data.status === 'success' && data.data?.link) {
      return NextResponse.json({ link: data.data.link, txRef });
    }

    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 502 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment initiation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
