import { getActivePostPaymentOffer, getUserDataForIntegration, handleResponseRedirection, isDLocalEnabled, setFormLoading, ZOTLO_GLOBAL } from "./index";
import { type FormConfig, PaymentProvider, type IZotloCheckoutParams, type IZotloCardParams, type PaymentDetail, type ProviderConfigs, TrialPackageType, PackageType } from "../lib/types";
import { getGooglePayClient, hasValidApplePayConfig } from "./loadProviderSdks";
import { CheckoutAPI } from "./api";
import { deleteSession, getSession } from "./session";
import { Logger, toCapturableError } from "../lib/logger";
import { COOKIE, getCookie } from "./cookie";
import { FORM_ITEMS } from "../lib/fields";

function prepareBillingInfo(formData: Record<string, any>, config: FormConfig) {
  const data = {
    businessName: formData[FORM_ITEMS.BILLING_BUSINESS_NAME.input.name] || '',
    addressLine: formData[FORM_ITEMS.BILLING_ADDRESS_LINE.input.name] || '',
    taxNumber: formData[FORM_ITEMS.BILLING_TAX_ID.input.name] || '',
    country: config.general.countryCode || '',
    city: formData[FORM_ITEMS.BILLING_CITY_TOWN.input.name],
  };

  const hasAnyValue = Object.values(data).some(value => value && value.trim() !== '');

  if (!hasAnyValue) return undefined;

  return data;
}

function preparePayload(payload: {
  providerKey: PaymentProvider;
  formData: Record<string, any>;
  params: IZotloCheckoutParams;
  config: FormConfig
}) {
  const { providerKey, formData, params, config } = payload;
  const { cardExpiration, acceptPolicy = true, cardNumber, cardHolder, cardCVV, saveCard, cardId = 0, cpfCnpj } = formData || {};
  const { returnUrl } = params || {};
  const showSavedCards = config.general.showSavedCards;
  const [cardExpirationMonth, cardExpirationYear] = cardExpiration?.split("/") || [];
  let data = {};

  switch (providerKey) {
    case PaymentProvider.CREDIT_CARD:
      data = {
        providerKey,
        acceptPolicy,
      };
      if (cardId) {
        data = {
          ...data,
          cardId,
        }
        break;
      }
      data = {
        ...data,
        creditCardDetails: {
          cardHolder,
          cardNumber: cardNumber?.replace(/\s/g, '') || '',
          cardExpirationMonth,
          cardExpirationYear: `20${cardExpirationYear}`,
          cardCVV,
        },
        ...(showSavedCards && { saveCard }),
      }
      break;
    case PaymentProvider.PAYPAL:
    case PaymentProvider.APPLE_PAY:
    case PaymentProvider.GOOGLE_PAY: {
      data = {
        providerKey,
        acceptPolicy,
      }

      if (
        !!config?.paymentData?.sandboxPayment &&
        [PaymentProvider.APPLE_PAY, PaymentProvider.GOOGLE_PAY].includes(providerKey)
      ) {
        (data as any).transactionId = (config?.providerConfigs as any)?.[providerKey]?.transactionId || "";
        (data as any)[`${providerKey}Token`] = 'aaaaaa';
      }
    }
      break;
    case PaymentProvider.PIX: {
      data = {
        providerKey,
        acceptPolicy,
      }
    }
      break;
    default:
      break;
  }

  // When dLocal is enabled identityCardNumber is required for every payment method,
  // When dLocal is not enabled identityCardNumber is required only for PIX
  if (cpfCnpj && (providerKey === PaymentProvider.PIX || isDLocalEnabled(config))) {
    data = {
      ...data,
      identityCardNumber: cpfCnpj.replace(/\D/g, ''),
    }
  }

  if (config.design?.businessPurchase?.enabled) {
    const canUserModify = config.design.businessPurchase?.canUserModify;
    const businessPurchaseChecked = canUserModify ? !!formData[FORM_ITEMS.BILLING_ACTIVATE.input.name] : true;
    const businessInfo = prepareBillingInfo(formData, config);
    data = {
      ...data,
      businessPurchaseChecked,
      ...(businessInfo && { businessInfo }),
    }
  }
  
  return {
    ...data,
    ...(returnUrl && { returnUrl }),
  }
}

export async function registerPaymentUser(subscriberId: string, config: FormConfig, params: IZotloCheckoutParams) {
  try {
    const registerType = config?.settings?.registerType;
    const existingSubscriberId = config?.general?.subscriberId;
    const canEditSubscriberId =  registerType === 'other' ? true : config?.settings?.allowSubscriberIdEditing;
    const hideSubscriberIdIfAlreadySet = registerType === 'other' ? false : config?.settings?.hideSubscriberIdIfAlreadySet;

    if (existingSubscriberId && hideSubscriberIdIfAlreadySet) return null;
    if (config.general.registerBypass && !canEditSubscriberId) return null;
    if (subscriberId === existingSubscriberId) return null;

    if (registerType === 'phoneNumber') {
      subscriberId = subscriberId.replace(/[^0-9]/g, '');
    }
    const response = await CheckoutAPI.post("/payment/register", { subscriberId });
    if (response?.meta?.errorCode) {
      params.events?.onFail?.({ message: response?.meta?.message, data: response?.meta })
    };
    return response;
  } catch (err:any) {
    params.events?.onFail?.({ message: err?.meta?.message || "Failed to register user", data: err?.meta });
    Logger.client?.captureException(err);
    return err;
  }
}

async function registerPaymentUserIfNecessary(subscriberId: string, config: FormConfig, params: IZotloCheckoutParams) {
  // If package is one time payment or no trial user will be registered once before payment, not everytime with onSubscriberIdEntered function
  if (!config?.packageInfo?.isProviderRefreshNecessary) { 
    const response = await registerPaymentUser(subscriberId, config, params);
    return response; 
  }
}

function handlePaymentErrorMessage(error:any, params: IZotloCheckoutParams, messageFallback?: string, extra?: Record<string, any>) {
  const message = (typeof error === 'string' ? error : error?.meta?.message) || messageFallback;
  params.events?.onFail?.({
    message,
    data: typeof error !== 'string' ? error : {}
  });
  Logger.client?.captureException(
    toCapturableError(error),
    extra ? { captureContext: { extra } } : undefined
  );
}

async function sendPurchaseEvents(payload: { config: FormConfig; result: PaymentDetail }) {
  const { config, result } = payload;
  const {
    transaction_id: transactionId = ' ',
    currency = ' ',
    price = '0.00',
    provider_name: paymentMethod = ''
  } = result?.transaction?.[0] || {};
  const packageData = result?.payment.package || {};
  const app = result.application;
  const priceValue = parseFloat(price || "0");
  const utmInfo = getCookie('utmInfo');
  const utmSource = (utmInfo ?  JSON.parse(utmInfo) : {})?.utm_source || '';
  const contents = [{
    content_id: packageData.packageId,
    content_name: packageData.name,
    price: priceValue,
    quantity: 1
  }];

  const { user_data: fbSiteData, context: tiktokContext } = await getUserDataForIntegration({
    registerType: config.settings.registerType,
    subscriberId: result.client.subscriberId || config.general.subscriberId
  });

  window?.GTM?.push({
    event: 'success',
    successType: 'Payment'
  });

  window?.GA4?.gtag('event', 'success', {
    successType: 'Payment'
  });

  const gtmObj = {
    transaction_id: transactionId,
    value: price,
    currency,
    coupon: ' ',
    subscriber_id: result.client.subscriberId || '',
    items: [
      {
        item_id: packageData.packageId,
        item_name: packageData.name,
        affiliation: utmSource,
        coupon: ' ',
        index: 1,
        item_brand: app.name || ' ',
        item_category: packageData.periodType || ' ',
        price,
        quantity: 1
      }
    ]
  }

  const subscriptionStarted = {
    subscriber_id: gtmObj.subscriber_id,
    transaction_id: gtmObj.transaction_id
  }

  window?.GTM?.push({ event: 'subscription_started', ...subscriptionStarted });
  window?.GA4?.gtag('event', 'subscription_started', subscriptionStarted);
  window?.GTM?.push({ event: 'purchase', payment_method: paymentMethod, ecommerce: gtmObj });
  window?.GA4?.gtag('event', 'purchase', { payment_method: paymentMethod, ...gtmObj, });

  if (window?.GA4?.options.googleAds.isActive) {
    window?.GA4?.gtag('event', 'conversion', {
      send_to: window?.GA4?.getConversionLabel(),
      value: gtmObj.value,
      currency: gtmObj.currency,
      transaction_id: gtmObj.transaction_id
    })
  }

  window?.Facebook?.purchase?.({
    value: priceValue,
    currency,
    userData: fbSiteData,
    otherData: {
      order_id: transactionId,
      packageId: packageData.packageId,
    }
  });

  window?.Tiktok?.identify?.(tiktokContext);
  window?.Tiktok?.purchase?.({
    value: priceValue,
    currency,
    description: app.name || ' ',
    content_id: packageData.packageId,
    orderID: transactionId,
    context: tiktokContext,
    contents
  });

  if (packageData.packageType === PackageType.SUBSCRIPTION) {
    const eventName = packageData.trialPackageType === TrialPackageType.NO ? 'Subscribe' : 'StartTrial';
    const fbObj = {
      value: priceValue,
      currency,
      packageId: packageData.packageId,
      ...fbSiteData
    };

    const ttObj = {
      value: priceValue,
      currency,
      content_type: 'product',
      contents,
      quantity: 1,
      ...tiktokContext
    }

    window?.Facebook?.track(eventName, fbObj);
    window?.Tiktok?.track(eventName, ttObj);
  }
}

/**
 * The session Uuid is the request auth header, so it is only dropped once the
 * flow has no further requests to make.
 */
export function endPaymentSession(payload: {
  config: FormConfig;
  params: IZotloCheckoutParams | IZotloCardParams;
}) {
  const { config, params } = payload;

  deleteSession({
    useCookie: !!params.useCookie,
    key: config.cardUpdate ? COOKIE.CARD_UUID : COOKIE.UUID
  });
}

/**
 * Plain payment detail fetch. Unlike handlePaymentSuccess it fires neither the
 * purchase events nor onSuccess, so the offer flow can refresh the detail
 * without duplicating them.
 */
export async function getPaymentDetail(params: IZotloCheckoutParams | IZotloCardParams) {
  const { result, meta } = await CheckoutAPI.get("/payment/detail");

  if (meta?.errorCode) {
    params.events?.onFail?.({ message: meta?.message, data: meta });
    return null;
  }

  return result as PaymentDetail;
}

export async function handlePaymentSuccess(payload: { config: FormConfig; params: IZotloCheckoutParams | IZotloCardParams; }) {
  try {
    setFormLoading(true);
    const { config, params } = payload;
    let result: PaymentDetail = {} as PaymentDetail;

    if (config.cardUpdate) {
      result = {
        application: {
          links: {
            customerSupportUrl: config.customerSupportUrl || ''
          }
        }
      } as PaymentDetail
    } else {
      const detail = await getPaymentDetail(params);

      if (!detail) return null;

      result = detail;
    }

    await sendPurchaseEvents({ config, result });

    params.events?.onSuccess?.({
      ...result,
      sessionId: getSession({ key: ZOTLO_GLOBAL.cardUpdate ? COOKIE.CARD_UUID : COOKIE.UUID })?.id || '',
      cardUpdate: ZOTLO_GLOBAL.cardUpdate
    });

    // A post payment offer still has a decision to send, so the session has to
    // outlive this function. The offer flow closes it once the user decides.
    if (!getActivePostPaymentOffer({ config, paymentDetail: result })) {
      endPaymentSession({ config, params });
    }

    return result;
  } catch (e) {
    Logger.client?.captureException(e);
    return null;
  } finally {
    setFormLoading(false);
  }
}

async function handleCheckoutResponse(payload: {
  checkoutResponse: Record<string, any>;
  params: IZotloCheckoutParams;
  refreshProviderConfigsFunction: () => Promise<void>;
  actions?: {
    redirectAction?: () => void;
    completeAction?: () => void;
    errorAction?: () => void;
  };
}) {
  const { checkoutResponse, params, actions, refreshProviderConfigsFunction } = payload;
  const { meta } = checkoutResponse || {};
  if (meta?.errorCode) {
    if (actions?.errorAction) actions.errorAction();
    await refreshProviderConfigsFunction();
    return params.events?.onFail?.({ message: meta?.message, data: meta });
  }

  if (meta.httpStatus === 200) {
    if (actions?.completeAction) actions.completeAction();
    handleResponseRedirection({
      response: checkoutResponse,
      params
    });
  }
}

// WebKit allows a single active Apple Pay session per page; a second session.begin()
// throws "Page already has an active payment session." (e.g. double-tap in in-app browsers)
let isApplePaySessionActive = false;

async function handleApplePayPayment(payload: {
  formPayload: Record<string, any>;
  providerConfig: ProviderConfigs["applePay"];
  params: IZotloCheckoutParams;
  config: FormConfig;
  subscriberId: string;
  refreshProviderConfigsFunction: () => Promise<void>;
}) {
  const {
    formPayload,
    providerConfig,
    params,
    config,
    subscriberId,
    refreshProviderConfigsFunction
  } = payload;

  if (isApplePaySessionActive) return;

  try {
    const providerKey = PaymentProvider.APPLE_PAY;

    if (!hasValidApplePayConfig(providerConfig)) {
      const initMeta = providerConfig?.initMeta;
      const initInfo = initMeta?.errorCode
        ? ` (init error ${initMeta.errorCode}: ${initMeta.message || ''})`
        : initMeta?.message
          ? ` (init: ${initMeta.message})`
          : '';
      await refreshProviderConfigsFunction();
      return handlePaymentErrorMessage(
        new Error(`Apple Pay provider config is missing or incomplete${initInfo}`),
        params,
        "Apple Pay payment process failed"
      );
    }

    const paymentRequestPayload = JSON.parse(JSON.stringify(providerConfig?.requestPayload));
    const transactionId = providerConfig?.transactionId;
    const ApplePaySession = (globalThis as any)?.ApplePaySession;

    const session = new ApplePaySession(2, paymentRequestPayload);
    let isSessionCancelled = false;

    const endSession = (abort = false) => {
      isApplePaySessionActive = false;
      if (abort) {
        try { session.abort(); } catch { /* session already closed */ }
      }
    };

    session.onvalidatemerchant = async (event: any) => {
      let response;
      const validationStart = Date.now();
      try {
        const sessionUrl = event.validationURL;
        response = await CheckoutAPI.post("/payment/session", { providerKey, sessionUrl, transactionId, returnUrl: params?.returnUrl || '' });
        // User dismissed the sheet while the session request was in flight;
        // the session is dead and completeMerchantValidation would throw
        // InvalidAccessError.
        if (isSessionCancelled) return;
        const { result, meta } = response;
        if (meta?.errorCode) {
          endSession(true);
          return params.events?.onFail?.({ message: meta?.message, data: meta });
        }
        const sessionData = result?.sessionData;
        session.completeMerchantValidation(sessionData);
      } catch (e) {
        if (isSessionCancelled) return;
        endSession(true);
        handlePaymentErrorMessage(e, params, "Apple Pay payment process failed", {
          response,
          validationElapsedMs: Date.now() - validationStart,
        });
      }
    };

    session.oncancel = () => {
      isSessionCancelled = true;
      isApplePaySessionActive = false;
    };

    session.onpaymentauthorized = async (event: any) => {
      const applePayToken = JSON.stringify(event.payment?.token || {});
      const payload = {
        ...formPayload,
        transactionId,
        applePayToken,
      };
      try {
        const checkoutResponse = await CheckoutAPI.post("/payment/checkout", payload);
        await handleCheckoutResponse({
          checkoutResponse,
          params,
          refreshProviderConfigsFunction,
          actions: {
            completeAction: () => {
              session.completePayment(ApplePaySession.STATUS_SUCCESS);
              isApplePaySessionActive = false;
            },
            errorAction: () => {
              session.completePayment(ApplePaySession.STATUS_FAILURE);
              endSession(true);
            },
          },
        });
      } catch (e) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        endSession(true);
        Logger.client?.captureException(e || 'Apple Pay checkout error -> onpaymentauthorized');
      }
    };

    const registerResponse = await registerPaymentUserIfNecessary(subscriberId, config, params);
    if (registerResponse?.meta?.errorCode) return;

    // Show apple pay modal
    session.begin();
    isApplePaySessionActive = true;
  } catch (error: any) {
    handlePaymentErrorMessage(error, params, "Apple Pay payment process failed");
  }
}

async function handleGooglePayPayment(payload: {
  formPayload: Record<string, any>;
  providerConfig: ProviderConfigs["googlePay"];
  params: IZotloCheckoutParams;
  config: FormConfig;
  subscriberId: string;
  refreshProviderConfigsFunction: () => Promise<void>;
}) {
  const {
    formPayload,
    providerConfig,
    params,
    config,
    subscriberId,
    refreshProviderConfigsFunction
  } = payload;
  try {
    const paymentDataRequest = JSON.parse(JSON.stringify(providerConfig?.paymentDataRequest));
    
    const registerResponse = await registerPaymentUserIfNecessary(subscriberId, config, params);
    if (registerResponse?.meta?.errorCode) return;

    const googleClientResponse = await getGooglePayClient()?.loadPaymentData?.(paymentDataRequest);
    const transactionId = providerConfig?.transactionId;
    const checkoutPayload = {
      ...formPayload,
      transactionId,
      googlePayToken: JSON.stringify(googleClientResponse || '{}'),
    }

    const checkoutResponse = await CheckoutAPI.post("/payment/checkout", checkoutPayload);
    await handleCheckoutResponse({
      checkoutResponse,
      params,
      refreshProviderConfigsFunction,
    });
  } catch (error: any) {
    // Prevent user closing form error (pay.js rejects with { statusCode: "CANCELED" })
    if (error?.toString()?.includes("AbortError") || error?.statusCode === "CANCELED") return;
    handlePaymentErrorMessage(error, params, "Google Pay payment process failed");
  }
}

export async function sendPayment(paymentParams: {
  providerKey: PaymentProvider;
  formData: Record<string, any>;
  params: IZotloCheckoutParams;
  config: FormConfig;
  refreshProviderConfigsFunction: () => Promise<void>;
}) {
  const { providerKey, formData, params, config, refreshProviderConfigsFunction } = paymentParams;
  try {
    const isSandboxPayment = !!config?.paymentData?.sandboxPayment;
    const payload = preparePayload({ providerKey, formData, params, config });
    const { subscriberId = "" } = formData || {};

    if (!isSandboxPayment && providerKey === PaymentProvider.APPLE_PAY) return handleApplePayPayment({
      formPayload: payload, 
      providerConfig: config?.providerConfigs?.applePay, 
      params,
      config,
      subscriberId,
      refreshProviderConfigsFunction
    });
    if (!isSandboxPayment && providerKey === PaymentProvider.GOOGLE_PAY) return handleGooglePayPayment({ 
      formPayload: payload, 
      providerConfig: config?.providerConfigs?.googlePay, 
      params,
      config,
      subscriberId,
      refreshProviderConfigsFunction
    });

    const registerResponse = await registerPaymentUserIfNecessary(subscriberId, config, params);
    if (registerResponse?.meta?.errorCode) return;

    // Send payment
    const checkoutResponse = await CheckoutAPI.post("/payment/checkout", payload);
    handleCheckoutResponse({ checkoutResponse, params, refreshProviderConfigsFunction });
  } catch (err:any) {
    handlePaymentErrorMessage(err, params);
  }
}
