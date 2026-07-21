import { type FormPaymentData, PaymentProvider, type FormConfig, type ProviderConfigs, DesignTheme } from "../lib/types";
import { getProvidersConfig } from "../utils/config/getCheckoutConfig";
import { Logger, toCapturableError } from "../lib/logger";

export type GooglePayButtonOptions = {
  buttonColor?: 'default' | 'black' | 'white';
}

const googlePaySdkUrl = 'https://pay.google.com/gp/p/js/pay.js';
const applePaySdkUrl = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
let googlePayClient: any = null;

function loadScript(src: string, id?: string): Promise<void> {
  return new Promise<void>((resolve) => {
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
      resolve()
    };

    document.head.appendChild(script);
  });
}

export async function loadProviderSDKs(params: { paymentInitData?: FormPaymentData }): Promise<void[]> {
  const { paymentInitData } = params || {};
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
      const PaymentsClient = googlePay?.payments?.api?.PaymentsClient;
      if (PaymentsClient) {
        googlePayClient = new PaymentsClient({ environment: googlePayEnvironment });
      }
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
    return client?.createButton?.({...payload, onClick: () => {}});
  } catch (e) {
    Logger.client?.captureException(toCapturableError(e));
    return null;
  }
}

export function renderGooglePayButton(config: FormConfig) {
  const googlePayConfig = config?.providerConfigs?.googlePay || {} as ProviderConfigs["googlePay"];
  const wrapper = document.getElementById('googlePay-button');
  const hasExistingButton = wrapper?.querySelector('button[data-provider]');
  const googlePayButton = getGooglePayButton(googlePayConfig, {
    buttonColor: config?.design?.darkMode ? 'white' : 'black'
  });

  if (hasExistingButton || !googlePayButton || !wrapper) return;

  // Google Pay re-renders its inner button asynchronously (dynamic card-info
  // button, possibly iframe-based), dropping any attribute/listener attached to
  // it — taps then skip form validation entirely. Keep Google's button purely
  // visual and capture all interaction with an overlay button that goes through
  // the same validation/submit pipeline as the other providers.
  googlePayButton.style.pointerEvents = 'none';
  googlePayButton.setAttribute('aria-hidden', 'true');
  googlePayButton.querySelector('button')?.setAttribute('tabindex', '-1');

  const overlay = document.createElement('button');
  overlay.setAttribute('data-provider', PaymentProvider.GOOGLE_PAY);
  overlay.setAttribute('type', config.design.theme === DesignTheme.HORIZONTAL ? 'submit' : 'button');
  overlay.setAttribute('aria-label', 'Google Pay');
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;margin:0;padding:0;border:0;background:transparent;cursor:pointer;z-index:1;';

  wrapper.style.position = 'relative';
  wrapper.appendChild(googlePayButton);
  wrapper.appendChild(overlay);
}

function prefetchGooglePaymentData(providerConfigs?: ProviderConfigs) {
  try {
    const payload = JSON.parse(JSON.stringify(providerConfigs?.googlePay?.paymentDataRequest));
    getGooglePayClient()?.prefetchPaymentData?.(payload);
  } catch (e) {
    Logger.client?.captureException(toCapturableError(e));
  }
}

export async function canMakeGooglePayPayments(providerConfigs?: ProviderConfigs) {
  if (import.meta.env.VITE_CONSOLE) return true;
  try {
    const isReadyToPayRequest = JSON.parse(JSON.stringify((providerConfigs?.googlePay?.isReadyToPayRequest || {})));
    const response = await getGooglePayClient()?.isReadyToPay?.(isReadyToPayRequest);
    return !!response?.result;
  } catch (e) {
    Logger.client?.captureException(toCapturableError(e));
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

export function hasValidApplePayConfig(applePayConfig?: ProviderConfigs["applePay"]) {
  if (import.meta.env.VITE_CONSOLE) return true;
  // These fields come from the /payment/init response; if that call fails or returns a partial
  // config, ApplePaySession rejects the request payload (e.g. missing merchantCapabilities)
  const requestPayload = applePayConfig?.requestPayload || {};
  return (
    Array.isArray(requestPayload.merchantCapabilities) && requestPayload.merchantCapabilities.length > 0 &&
    Array.isArray(requestPayload.supportedNetworks) && requestPayload.supportedNetworks.length > 0 &&
    !!requestPayload.countryCode &&
    !!requestPayload.currencyCode &&
    !!applePayConfig?.transactionId
  );
}

export function hasValidGooglePayConfig(googlePayConfig?: ProviderConfigs["googlePay"]) {
  if (import.meta.env.VITE_CONSOLE) return true;
  // These fields come from the /payment/init response; if that call fails or returns a partial
  // config, pay.js throws DEVELOPER_ERROR (e.g. "currencyCode in transactionInfo must be set!")
  const paymentDataRequest = googlePayConfig?.paymentDataRequest;
  const transactionInfo = paymentDataRequest?.transactionInfo;
  return (
    !!transactionInfo?.currencyCode &&
    !!transactionInfo?.totalPrice &&
    Array.isArray(paymentDataRequest?.allowedPaymentMethods) && paymentDataRequest.allowedPaymentMethods.length > 0 &&
    !!googlePayConfig?.transactionId
  );
}

export async function prepareProviders(config: FormConfig, returnUrl: string) {
  let providerConfigs = {} as ProviderConfigs;
  [providerConfigs] = await Promise.all([
    getProvidersConfig(config?.paymentData || {} as FormPaymentData, returnUrl, config?.general?.countryCode),
    loadProviderSDKs({ paymentInitData: config?.paymentData })
  ]);

  const canAppleMakePayments = canMakeApplePayPayments() && hasValidApplePayConfig(providerConfigs?.applePay);
  const isGooglePayEnabled = !!config?.paymentData?.providers?.[PaymentProvider.GOOGLE_PAY] && hasValidGooglePayConfig(providerConfigs?.googlePay);
  const isGoogleReadyToPay = isGooglePayEnabled && await canMakeGooglePayPayments(providerConfigs);

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
