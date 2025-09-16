import { setFormLoading } from "./index";
import { createPaymentSuccessForm } from "../lib/create";
import { type FormConfig, PaymentProvider, PaymentResultStatus, type IZotloCheckoutParams, type PaymentDetail, type ProviderConfigs } from "../lib/types";
import { getGooglePayClient } from "./loadProviderSdks";
import { API } from "./api";
import { deleteUuidCookie } from "./cookie";

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
    if (response?.meta?.errorCode) params.events?.onFail?.({ message: response?.meta?.message, data: response?.meta });
    return response;
  } catch (err:any) {
    params.events?.onFail?.({ message: err?.meta?.message || "Failed to register user", data: err?.meta });
    return err;
  }
}

async function registerPaymentUserIfNecessary(subscriberId: string, config: FormConfig, params: IZotloCheckoutParams) {
  // If package is one time payment or no trial user will be registered once before payment, not everytime with onSubscriberIdEntered function
  if (!config?.packageInfo?.isProviderRefreshNecessary) await registerPaymentUser(subscriberId, config, params);
}

export async function handlePaymentSuccess(payload: { params: IZotloCheckoutParams; }) {
  try {
    setFormLoading(true);
    const { params } = payload;
    const { result, meta } = await API.get("/payment/detail");

    if (meta?.errorCode) {
      params.events?.onFail?.({ message: meta?.message, data: meta });
      return null
    }

    deleteUuidCookie();
    params.events?.onSuccess?.(result as PaymentDetail);
    return result as PaymentDetail;
  } catch {
    return null;
  } finally {
    setFormLoading(false);
  }
}

async function handleCheckoutResponse(payload: {
  checkoutResponse: Record<string, any>;
  params: IZotloCheckoutParams;
  containerId: string;
  config: FormConfig;
  refreshProviderConfigsFunction: () => Promise<void>;
  actions?: {
    redirectAction?: () => void;
    completeAction?: () => void;
    errorAction?: () => void;
  };
}) {
  const { checkoutResponse, params, containerId, config, actions, refreshProviderConfigsFunction } = payload;
  const { meta, result } = checkoutResponse || {};
  if (meta?.errorCode) {
    if (actions?.errorAction) actions.errorAction();
    await refreshProviderConfigsFunction();
    return params.events?.onFail?.({ message: meta?.message, data: meta });
  }

  if (meta.httpStatus === 200) {
    const { status, redirectUrl, payment } = result || {};
    if (status === PaymentResultStatus.REDIRECT && !!redirectUrl && globalThis?.location?.href) {
      if (actions?.redirectAction) return actions.redirectAction();
      globalThis.location.href = redirectUrl;
    }
    if (status === PaymentResultStatus.COMPLETE && payment) {
      if (actions?.completeAction) actions.completeAction();
      const paymentDetail = await handlePaymentSuccess({ params });
      if (paymentDetail) createPaymentSuccessForm({ containerId, config, paymentDetail });
    }
  }
}

async function handleApplePayPayment(payload: {
  formPayload: Record<string, any>;
  providerConfig: ProviderConfigs["applePay"];
  params: IZotloCheckoutParams;
  containerId: string;
  config: FormConfig;
  subscriberId: string;
  refreshProviderConfigsFunction: () => Promise<void>;
}) {
  const {
    formPayload,
    providerConfig,
    params,
    config,
    containerId,
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
      if (meta?.errorCode) return params.events?.onFail?.({ message: meta?.message, data: meta });
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
          config,
          containerId,
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
      } catch {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        session.abort();
      }
    };

    await registerPaymentUserIfNecessary(subscriberId, config, params);

    // Show apple pay modal
    session.begin();
  } catch (error: any) {
    const message = (typeof error === 'string' ? error : error?.meta?.message) || "Apple Pay payment process failed";
    params.events?.onFail?.({
      message,
      data: typeof error !== 'string' ? error : {}
    });
  }
}

async function handleGooglePayPayment(payload: {
  formPayload: Record<string, any>;
  providerConfig: ProviderConfigs["googlePay"];
  params: IZotloCheckoutParams;
  containerId: string;
  config: FormConfig;
  subscriberId: string;
  refreshProviderConfigsFunction: () => Promise<void>;
}) {
  const {
    formPayload,
    providerConfig,
    params,
    config,
    containerId,
    subscriberId,
    refreshProviderConfigsFunction
  } = payload;
  try {
    const paymentDataRequest = JSON.parse(JSON.stringify(providerConfig?.paymentDataRequest));
    const googleClientResponse = await getGooglePayClient()?.loadPaymentData(paymentDataRequest);
    const googlePayToken = googleClientResponse?.paymentMethodData?.tokenizationData?.token;
    const transactionId = providerConfig?.transactionId;
    const checkoutPayload = {
      ...formPayload,
      transactionId,
      googlePayToken,
    }
    await registerPaymentUserIfNecessary(subscriberId, config, params);
    const checkoutResponse = await API.post("/payment/checkout", checkoutPayload);
    await handleCheckoutResponse({
      checkoutResponse,
      params,
      config,
      containerId,
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
  }
}

export async function sendPayment(paymentParams: {
  providerKey: PaymentProvider;
  formData: Record<string, any>;
  params: IZotloCheckoutParams;
  config: FormConfig;
  containerId: string;
  refreshProviderConfigsFunction: () => Promise<void>;
}) {
  const { providerKey, formData, params, config, containerId, refreshProviderConfigsFunction } = paymentParams;
  try {
    const isSandboxPayment = !!config?.paymentData?.sandboxPayment;
    const payload = preparePayload({ providerKey, formData, params, config });
    const { subscriberId = "" } = formData || {};

    if (!isSandboxPayment && providerKey === PaymentProvider.APPLE_PAY) return handleApplePayPayment({
      formPayload: payload, 
      providerConfig: config?.providerConfigs?.applePay, 
      params,
      config,
      containerId,
      subscriberId,
      refreshProviderConfigsFunction
    });
    if (!isSandboxPayment && providerKey === PaymentProvider.GOOGLE_PAY) return handleGooglePayPayment({ 
      formPayload: payload, 
      providerConfig: config?.providerConfigs?.googlePay, 
      params,
      config,
      containerId,
      subscriberId,
      refreshProviderConfigsFunction
    });

    await registerPaymentUserIfNecessary(subscriberId, config, params);

    // Send payment
    const checkoutResponse = await API.post("/payment/checkout", payload);
    handleCheckoutResponse({ checkoutResponse, params, containerId, config, refreshProviderConfigsFunction });

  } catch (err:any) {
    params.events?.onFail?.({ message: err?.meta?.message, data: err?.meta });
  }
}
