declare global {
  interface Window {
    FlutterwaveCheckout: (config: FlutterwaveConfig) => void;
  }
}

interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: { email: string; name: string };
  callback: (response: { transaction_id?: string; status: string; tx_ref: string }) => void;
  onclose: () => void;
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || '';

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (typeof window.FlutterwaveCheckout !== 'undefined') {
    scriptPromise = Promise.resolve();
    return scriptPromise;
  }
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave SDK'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function preloadFlutterwave(): void {
  loadScript();
}

export async function openFlutterwaveCheckout(params: {
  txRef: string;
  amount: number;
  email: string;
  name: string;
  onSuccess: (transactionId: string) => void;
  onClose?: () => void;
}): Promise<void> {
  if (!PUBLIC_KEY || PUBLIC_KEY === 'FLWPUBK_TEST-xxxxxxxx-X') {
    throw new Error('Flutterwave public key not configured');
  }

  await loadScript();

  window.FlutterwaveCheckout({
    public_key: PUBLIC_KEY,
    tx_ref: params.txRef,
    amount: params.amount,
    currency: 'NGN',
    payment_options: 'card, ussd, mobilemoney',
    customer: { email: params.email, name: params.name },
    callback: (response) => {
      if (response.status === 'success' && response.transaction_id) {
        params.onSuccess(response.transaction_id);
      }
    },
    onclose: () => {
      params.onClose?.();
    },
  });
}
