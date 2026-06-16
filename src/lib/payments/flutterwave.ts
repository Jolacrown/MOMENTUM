import 'server-only';

/**
 * Flutterwave Integration Service.
 * Per flutterwave-integration skill and security.md.
 * Note: Secret keys must NEVER be exposed to the frontend.
 */

export interface PaymentInitialization {
  tx_ref: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
}

/**
 * Initiates a payment.
 * On mobile, this usually returns a link for a WebView or 
 * handles via Flutterwave standard redirect.
 */
export const initiatePayment = async (data: PaymentInitialization) => {
  const secretKey = process.env.FLW_SECRET_KEY;
  
  if (!secretKey || secretKey === 'your_flutterwave_secret_key_here') {
    throw new Error('Flutterwave secret key not configured');
  }

  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Payment initiation failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Verifies a transaction status.
 * ALWAYS call this from the backend.
 */
export const verifyTransaction = async (txId: string) => {
  if (!txId) {
    throw new Error('Transaction ID is required');
  }

  const secretKey = process.env.FLW_SECRET_KEY;

  if (!secretKey || secretKey === 'your_flutterwave_secret_key_here') {
    throw new Error('Flutterwave secret key not configured');
  }

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(txId)}/verify`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Transaction verification failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};
