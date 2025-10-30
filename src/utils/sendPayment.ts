import { setFormLoading } from "./index";
import { type FormConfig, PaymentProvider, PaymentResultStatus, type IZotloCheckoutParams, type PaymentDetail, type ProviderConfigs } from "../lib/types";
import { getGooglePayClient } from "./loadProviderSdks";
import { API } from "./api";
import { deleteSession } from "./session";
import { Logger } from "../lib/logger";

function preparePayload(payload: {
  providerKey: PaymentProvider;
  formData: Record<string, any>;
  params: IZotloCheckoutParams;
  config: FormConfig
}) {
  const { providerKey, formData, params, config } = payload;
  const { cardExpiration, acceptPolicy, cardNumber, cardHolder, cardCVV, zipCode } = formData || {};
  const { returnUrl } = params || {};
  const [cardExpirationMonth, cardExpirationYear] = cardExpiration?.split("/") || [];
  let data = {};

  switch (providerKey) {
    case PaymentProvider.CREDIT_CARD:
      data = {
        providerKey,
        acceptPolicy,
        creditCardDetails: {
          cardHolder,
          cardNumber: cardNumber?.replace(/\s/g, '') || '',
          cardExpirationMonth,
          cardExpirationYear: `20${cardExpirationYear}`,
          cardCVV,
        }
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
    default:
      break;
  }
  
  return {
    ...data,
    ...(zipCode && { zipCode }),
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
    const response = await API.post("/payment/register", { subscriberId });
    if (response?.meta?.errorCode) {
      params.events?.onFail?.({ message: response?.meta?.message, data: response?.meta })
      Logger.client?.captureEvent({
        level: 'error',
        message: response?.meta?.message || 'Payment user registration failed -> registerPaymentUser',
        extra: response?.meta
      });
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

export async function handlePaymentSuccess(payload: { params: IZotloCheckoutParams; }) {
  try {
    setFormLoading(true);
    const { params } = payload;
    const { result, meta } = await API.get("/payment/detail");

    if (meta?.errorCode) {
      params.events?.onFail?.({ message: meta?.message, data: meta });
      Logger.client?.captureEvent({
        level: 'error',
        message: meta?.message || 'Fetching payment detail failed -> handlePaymentSuccess',
        extra: meta
      });
      return null
    }

    deleteSession({ useCookie: !!params.useCookie });
    params.events?.onSuccess?.(result as PaymentDetail);
    return result as PaymentDetail;
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
  const { meta, result } = checkoutResponse || {};
  if (meta?.errorCode) {
    if (actions?.errorAction) actions.errorAction();
    await refreshProviderConfigsFunction();
    Logger.client?.captureEvent({
      level: 'error',
      message: meta?.message || 'Payment checkout failed -> handleCheckoutResponse',
      extra: meta
    });
    return params.events?.onFail?.({ message: meta?.message, data: meta });
  }

  if (meta.httpStatus === 200) {
    const { status, redirectUrl, payment } = result || {};
    const returnUrl = payment?.returnUrl || '';
    if (status === PaymentResultStatus.REDIRECT && !!redirectUrl && globalThis?.location?.href) {
      if (actions?.redirectAction) return actions.redirectAction();
      globalThis.location.href = redirectUrl;
    }
    if (status === PaymentResultStatus.COMPLETE && payment) {
      if (actions?.completeAction) actions.completeAction();
      if (returnUrl) globalThis.location.href = returnUrl;
    }
  }
}

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
  try {
    const providerKey = PaymentProvider.APPLE_PAY;
    const paymentRequestPayload = JSON.parse(JSON.stringify(providerConfig?.requestPayload));
    const transactionId = providerConfig?.transactionId;
    const ApplePaySession = (globalThis as any)?.ApplePaySession;

    const session = new ApplePaySession(2, paymentRequestPayload);

    session.onvalidatemerchant = async (event: any) => {
      const sessionUrl = event.validationURL;
      const { result, meta } = await API.post("/payment/session", { providerKey, sessionUrl, transactionId, returnUrl: params?.returnUrl || '' });
      if (meta?.errorCode) {
        Logger.client?.captureEvent({
          level: 'error',
          message: meta?.message || 'Apple Pay merchant validation failed',
          extra: meta
        });
        return params.events?.onFail?.({ message: meta?.message, data: meta });
      }
      const sessionData = result?.sessionData;
      session.completeMerchantValidation(sessionData);
    };

    session.oncancel = () => {
      // Handle cancel event
    };

    session.onpaymentauthorized = async (event: any) => {
      const applePayToken = JSON.stringify(event.payment?.token || {});
      const payload = {
        ...formPayload,
        transactionId,
        applePayToken,
      };
      try {
        const checkoutResponse = await API.post("/payment/checkout", payload);
        await handleCheckoutResponse({
          checkoutResponse,
          params,
          refreshProviderConfigsFunction,
          actions: {
            completeAction: () => {
              session.completePayment(ApplePaySession.STATUS_SUCCESS);
            },
            errorAction: () => {
              session.completePayment(ApplePaySession.STATUS_FAILURE);
              session.abort();
            },
          },
        });
      } catch (e) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        session.abort();
        Logger.client?.captureException(e || 'Apple Pay checkout error -> onpaymentauthorized');
      }
    };

    const registerResponse = await registerPaymentUserIfNecessary(subscriberId, config, params);
    if (registerResponse?.meta?.errorCode) return;

    // Show apple pay modal
    session.begin();
  } catch (error: any) {
    const message = (typeof error === 'string' ? error : error?.meta?.message) || "Apple Pay payment process failed";
    params.events?.onFail?.({
      message,
      data: typeof error !== 'string' ? error : {}
    });
    Logger.client?.captureException(error);
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

    const googleClientResponse = await getGooglePayClient()?.loadPaymentData(paymentDataRequest);
    const googlePayToken = googleClientResponse?.paymentMethodData?.tokenizationData?.token;
    const transactionId = providerConfig?.transactionId;
    const checkoutPayload = {
      ...formPayload,
      transactionId,
      googlePayToken,
    }

    const checkoutResponse = await API.post("/payment/checkout", checkoutPayload);
    await handleCheckoutResponse({
      checkoutResponse,
      params,
      refreshProviderConfigsFunction,
    });
  } catch (error: any) {
    // Prevent user closing form error
    if (error?.toString()?.includes("AbortError")) return;
    const message = (typeof error === 'string' ? error : error?.meta?.message) || "Google Pay payment process failed";
    params.events?.onFail?.({
      message,
      data: typeof error !== 'string' ? error : {}
    });
    Logger.client?.captureException(error);
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
    const checkoutResponse = await API.post("/payment/checkout", payload);
    handleCheckoutResponse({ checkoutResponse, params, refreshProviderConfigsFunction });

  } catch (err:any) {
    params.events?.onFail?.({ message: err?.meta?.message, data: err?.meta });
    Logger.client?.captureException(err);
  }
}
