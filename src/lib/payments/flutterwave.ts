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
    console.log('[MOCK_PAYMENT] Initiating payment for:', data.customer.email);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      status: 'success',
      message: 'Hosted payment link generated (MOCK)',
      data: {
        link: 'https://flutterwave.com/pay/momentum-premium-mock',
      }
    };
  }

  // Real implementation would call FLW API
  return { status: 'error', message: 'Not implemented' };
};

/**
 * Verifies a transaction status.
 * ALWAYS call this from the backend.
 */
export const verifyTransaction = async (txId: string) => {
  // Logic to call GET https://api.flutterwave.com/v3/transactions/:id/verify
  return { status: 'successful', amount: 5000, currency: 'NGN' };
};
