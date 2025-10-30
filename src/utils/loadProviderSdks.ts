import { type FormPaymentData, PaymentProvider, type FormConfig, type ProviderConfigs, DesignTheme } from "../lib/types";
import { getProvidersConfig } from "../utils/getConfig";
import { Logger } from "../lib/logger";

export type GooglePayButtonOptions = {
  buttonColor?: 'default' | 'black' | 'white';
}

const googlePaySdkUrl = 'https://pay.google.com/gp/p/js/pay.js';
const applePaySdkUrl = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
let googlePayClient: any = null;

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
    script.onload = () => {
      // This resolves rendering problem for apple-pay-modal component on mobile devices
      const modal = document.querySelector('apple-pay-modal') as HTMLElement | null;

      if (modal) {
        modal.style.display = 'none';
        
        setTimeout(() => {
          modal.style.display = '';
        }, 2000);
      }

      // Emit as done
      resolve();
    };
    script.onerror = () => {
      const err = new Error(`Failed to load script: ${src}`);
      Logger.client?.captureException(err);
      reject(err);
    };

    document.head.appendChild(script);
  });
}

export async function loadProviderSDKs(paymentInitData?: FormPaymentData): Promise<void[]> {
  const { providers = {} as Record<PaymentProvider, boolean> } = paymentInitData || {};
  const promises: Promise<void>[] = [];

  if (providers?.[PaymentProvider.APPLE_PAY]) promises.push(loadScript(applePaySdkUrl, 'apple-pay-sdk'));
  if (providers?.[PaymentProvider.GOOGLE_PAY]) promises.push(loadScript(googlePaySdkUrl, 'google-pay-sdk'));

  return Promise.all(promises);
}

export function getGooglePayClient() {
  const googlePayEnvironment = import.meta.env.VITE_GOOGLE_PAY_ENVIRONMENT || 'TEST';
  if (googlePayClient === null) {
    const googlePay = (globalThis as any)?.google;
    if (googlePay) {
      googlePayClient = new googlePay.payments.api.PaymentsClient({ environment: googlePayEnvironment });
    }
  }
  return googlePayClient;
}

export function getGooglePayButton(googlePayConfig: ProviderConfigs["googlePay"], options?: GooglePayButtonOptions): HTMLDivElement | null {
  try {
    const {
      buttonColor = 'default',
    } = options || {};
    const allowedPaymentMethods = JSON.parse(JSON.stringify(googlePayConfig?.paymentDataRequest?.allowedPaymentMethods || []));
    const payload = JSON.parse(JSON.stringify({
      buttonColor,
      buttonType: 'plain',
      buttonSizeMode: 'fill',
      buttonRadius: 6,
      allowedPaymentMethods
    }));
    const client = getGooglePayClient();
    return client?.createButton({...payload, onClick: () => {}});
  } catch (e) {
    Logger.client?.captureException(e);
    return null;
  }
}

export function renderGooglePayButton(config: FormConfig) {
  const googlePayConfig = config?.providerConfigs?.googlePay || {} as ProviderConfigs["googlePay"];
  const wrapper = document.getElementById('google-pay-button');
  const hasExistingButton = wrapper?.querySelector('button');
  const googlePayButton = getGooglePayButton(googlePayConfig, { 
    buttonColor: config?.design?.darkMode ? 'white' : 'black' 
  });
  const innerButton = googlePayButton?.querySelector('button');
  innerButton?.setAttribute('data-provider', PaymentProvider.GOOGLE_PAY);
  if (config.design.theme === DesignTheme.HORIZONTAL) {
    innerButton?.setAttribute('type', 'submit');
  } else {
    innerButton?.setAttribute('type', 'button');
  }

  if (!hasExistingButton && googlePayButton) wrapper?.appendChild(googlePayButton);
}

function prefetchGooglePaymentData(providerConfigs?: ProviderConfigs) {
  try {
    const payload = JSON.parse(JSON.stringify(providerConfigs?.googlePay?.paymentDataRequest));
    getGooglePayClient()?.prefetchPaymentData(payload);
  } catch (e) {
    Logger.client?.captureException(e);
  }
}

export async function canMakeGooglePayPayments(providerConfigs?: ProviderConfigs) {
  if (import.meta.env.VITE_CONSOLE) return true;
  try {
    const isReadyToPayRequest = JSON.parse(JSON.stringify((providerConfigs?.googlePay?.isReadyToPayRequest || {})));
    const response = await getGooglePayClient()?.isReadyToPay(isReadyToPayRequest);
    return !!response?.result;
  } catch (e) {
    Logger.client?.captureException(e);
    return false;
  }
}

export function canMakeApplePayPayments() {
  if (import.meta.env.VITE_CONSOLE) return true;
  try {
    return (globalThis as any)?.ApplePaySession?.canMakePayments();
  } catch (e) {
    Logger.client?.captureException(e);
    return false;
  }
}

export async function prepareProviders(config: FormConfig, returnUrl: string) {
  let providerConfigs = {} as ProviderConfigs;
  [providerConfigs] = await Promise.all([
    getProvidersConfig(config?.paymentData || {} as FormPaymentData, returnUrl, config?.general?.countryCode),
    loadProviderSDKs(config?.paymentData)
  ]);

  const canAppleMakePayments = canMakeApplePayPayments();
  const isGoogleReadyToPay = await canMakeGooglePayPayments(providerConfigs);

  if (isGoogleReadyToPay) prefetchGooglePaymentData(providerConfigs);

  return {
    ...providerConfigs,
    applePay: {
      ...providerConfigs?.applePay,
      canMakePayments: canAppleMakePayments,
    },
    googlePay: {
      ...providerConfigs?.googlePay,
      isReadyToPay: isGoogleReadyToPay,
    }
  }
}
