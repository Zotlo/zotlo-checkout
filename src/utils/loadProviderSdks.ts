import { type FormPaymentData, PaymentProvider } from "../lib/types";

const googlePaySdkUrl = 'https://pay.google.com/gp/p/js/pay.js';
const applePaySdkUrl = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';

function loadScript(src: string, id?: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Prevent loading the same script multiple times based on src
    const isScriptExist = Array.from(document.getElementsByTagName('script')).find(
      (script) => script.src === src
    );

    if (isScriptExist) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    if (id) script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

export async function loadProviderSDKs(paymentInitData?: FormPaymentData): Promise<void[]> {
  const { providers = {} } = paymentInitData || {};
  const promises: Promise<void>[] = [];

  if (!!providers?.[PaymentProvider.APPLE_PAY]) promises.push(loadScript(applePaySdkUrl, 'apple-pay-sdk'));
  if (!!providers?.[PaymentProvider.GOOGLE_PAY]) promises.push(loadScript(googlePaySdkUrl, 'google-pay-sdk'));

  return Promise.all(promises);
}