import { type FormPaymentData, PaymentProvider, type FormConfig, type ProviderConfigs, DesignTheme } from "../lib/types";
import { getProvidersConfig } from "../utils/config/getCheckoutConfig";
import { Logger, toCapturableError } from "../lib/logger";

export type GooglePayButtonOptions = {
  buttonColor?: 'default' | 'black' | 'white';
}

const googlePaySdkUrl = 'https://pay.google.com/gp/p/js/pay.js';
const applePaySdkUrl = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
const scriptRetryDelayMs = 1000;
// Upper limit for the retry so a hanging network doesn't hold the form back twice
const scriptRetryTimeoutMs = 3000;
// Successful and in-flight loads by src; failed loads are removed so the next call retries
const scriptLoaders = new Map<string, Promise<void>>();
let googlePayClient: any = null;

type ScriptLoadResult = 'loaded' | 'failed' | 'timeout';

function injectScript(src: string, id?: string, timeoutMs?: number): Promise<ScriptLoadResult> {
  return new Promise<ScriptLoadResult>((resolve) => {
    // On timeout only stop waiting; the tag stays so a late load is still usable on the next render
    const timer = timeoutMs ? setTimeout(() => resolve('timeout'), timeoutMs) : undefined;
    const script = document.createElement('script');
    if (id) script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      // This resolves rendering problem for apple-pay-modal component on mobile devices
      const modal = document.querySelector('apple-pay-modal') as HTMLElement | null;

      if (modal) {
        modal.style.display = 'none';
        
        setTimeout(() => {
          modal.style.display = '';
        }, 2000);
      }

      // Emit as done
      resolve('loaded');
    };
    script.onerror = () => {
      clearTimeout(timer);
      // Drop the failed tag, otherwise it would be treated as an existing script later on
      script.remove();
      resolve('failed');
    };

    document.head.appendChild(script);
  });
}

function loadScript(src: string, id: string, provider: PaymentProvider): Promise<void> {
  // Reuse a successful or still loading request instead of reporting it as ready too early
  const existingLoader = scriptLoaders.get(src);
  if (existingLoader) return existingLoader;

  // Script added outside of this loader (e.g. by the host page)
  const isScriptExist = Array.from(document.getElementsByTagName('script')).some(
    (script) => script.src === src
  );
  if (isScriptExist) return Promise.resolve();

  const loader = (async () => {
    let result = await injectScript(src, id);

    // Retry once for transient network failures, mostly seen on mobile in-app browsers
    if (result === 'failed') {
      await new Promise((resolve) => setTimeout(resolve, scriptRetryDelayMs));
      result = await injectScript(src, id, scriptRetryTimeoutMs);
    }

    if (result === 'loaded') return;

    scriptLoaders.delete(src);
    // The flow continues without this provider, so it's reported as a warning
    Logger.captureException(new Error(`Failed to load script: ${src}`), {
      captureContext: { level: 'warning', tags: { provider, reason: result } }
    });
  })();

  scriptLoaders.set(src, loader);
  return loader;
}

export async function loadProviderSDKs(params: { paymentInitData?: FormPaymentData }): Promise<void[]> {
  const { paymentInitData } = params || {};
  const { providers = {} as Record<PaymentProvider, boolean> } = paymentInitData || {};
  const promises: Promise<void>[] = [];

  if (providers?.[PaymentProvider.APPLE_PAY]) promises.push(loadScript(applePaySdkUrl, 'apple-pay-sdk', PaymentProvider.APPLE_PAY));
  if (providers?.[PaymentProvider.GOOGLE_PAY]) promises.push(loadScript(googlePaySdkUrl, 'google-pay-sdk', PaymentProvider.GOOGLE_PAY));

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
    Logger.captureException(toCapturableError(e));
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
    Logger.captureException(toCapturableError(e));
  }
}

export async function canMakeGooglePayPayments(providerConfigs?: ProviderConfigs) {
  if (import.meta.env.VITE_CONSOLE) return true;
  try {
    const isReadyToPayRequest = JSON.parse(JSON.stringify((providerConfigs?.googlePay?.isReadyToPayRequest || {})));
    const response = await getGooglePayClient()?.isReadyToPay?.(isReadyToPayRequest);
    return !!response?.result;
  } catch (e) {
    Logger.captureException(toCapturableError(e));
    return false;
  }
}

// In-app browsers (e.g. Facebook, Instagram) inject scripts into the page, so WebKit treats
// it as an "insecure document" and disables Apple Pay, whatever the page's certificate
export function isApplePayInsecureDocumentError(error: any) {
  return error?.name === 'InvalidAccessError' && !!error?.message?.includes('insecure document');
}

export function canMakeApplePayPayments() {
  if (import.meta.env.VITE_CONSOLE) return true;
  try {
    return (globalThis as any)?.ApplePaySession?.canMakePayments();
  } catch (e) {
    // Expected in in-app browsers, the button is just hidden
    Logger.captureException(e, isApplePayInsecureDocumentError(e)
      ? { captureContext: { level: 'warning', tags: { provider: PaymentProvider.APPLE_PAY } } }
      : undefined
    );
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

let isFramePaymentWarningSent = false;

// Inside an iframe without allow="payment", PaymentRequest (used by pay.js, and by Apple's
// SDK on non-Safari browsers) throws SecurityError, so the wallet buttons would render but
// never work. Browsers without the policy API (e.g. Safari) are left as they are.
export function isPaymentAllowedInFrame() {
  if (import.meta.env.VITE_CONSOLE) return true;
  if (window.self === window.top) return true;

  const policy = (document as any).permissionsPolicy || (document as any).featurePolicy;
  const isAllowed = policy?.allowsFeature ? !!policy.allowsFeature('payment') : true;

  if (!isAllowed && !isFramePaymentWarningSent) {
    isFramePaymentWarningSent = true;
    Logger.captureException(new Error('Wallet payments disabled: iframe is missing allow="payment"'), {
      captureContext: { level: 'warning' }
    });
  }

  return isAllowed;
}

export async function prepareProviders(config: FormConfig, returnUrl: string) {
  let providerConfigs = {} as ProviderConfigs;
  [providerConfigs] = await Promise.all([
    getProvidersConfig(config?.paymentData || {} as FormPaymentData, returnUrl, config?.general?.countryCode),
    loadProviderSDKs({ paymentInitData: config?.paymentData })
  ]);

  const isPaymentAllowed = isPaymentAllowedInFrame();
  const canAppleMakePayments = isPaymentAllowed && canMakeApplePayPayments() && hasValidApplePayConfig(providerConfigs?.applePay);
  const isGooglePayEnabled = isPaymentAllowed && !!config?.paymentData?.providers?.[PaymentProvider.GOOGLE_PAY] && hasValidGooglePayConfig(providerConfigs?.googlePay);
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
