import { createPaymentSuccessForm } from "../lib/create";
import { type FormConfig, PaymentProvider, PaymentResultStatus, type IZotloCheckoutParams } from "../lib/types";
import { API } from "./api";

function preparePayload(providerKey: PaymentProvider, formData: Record<string, any>, params: IZotloCheckoutParams) {
  const { cardExpiration, acceptPolicy, cardNumber, cardHolder, cardCVV } = formData || {};
  const { returnUrl } = params || {};
  const [cardExpirationMonth, cardExpirationYear] = cardExpiration?.split("/") || [];
  let payload = {};

  switch (providerKey) {
    case PaymentProvider.CREDIT_CARD:
      payload = {
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
    case PaymentProvider.GOOGLE_PAY:
      payload = {
        providerKey,
        acceptPolicy,
      }
      break;
    default:
      break;
  }
  
  return {
    ...payload,
    ...(returnUrl && { returnUrl }),
  }
}

async function registerPaymentUser(subscriberId: string, config: FormConfig, params: IZotloCheckoutParams) {
  try {
    const existingSubscriberId = config?.general?.subscriberId;
    const registerType = config?.settings?.registerType;
    if (!subscriberId || existingSubscriberId) return null;
    if (registerType === 'phoneNumber') {
      subscriberId = subscriberId.replace(/[^0-9]/g, '');
    }
    const response = await API.post("/payment/register", { subscriberId });
    if (response?.meta?.errorCode) params.events?.onFail?.({ message: response?.meta?.message, data: response?.meta });
    return response;
  } catch {
    params.events?.onFail?.({ message: "Failed to register user", data: {} });
  }
}

function handleCheckoutResponse(payload: {
  checkoutResponse: Record<string, any>;
  params: IZotloCheckoutParams;
  containerId: string;
  config: FormConfig;
  actions?: {
    redirectAction?: () => void;
    completeAction?: () => void;
    errorAction?: () => void;
  };
}) {
  const { checkoutResponse, params, containerId, config, actions } = payload;
  const { meta, result } = checkoutResponse || {};
  if (meta?.errorCode) {
    if (actions?.errorAction) actions.errorAction();
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
      createPaymentSuccessForm({ containerId, config });
      params.events?.onSuccess?.();
    }
  }
}

async function handleApplePayPayment(payload: {
  formPayload: Record<string, any>;
  providerConfig: Record<string, any>;
  subscriberId: string;
  params: IZotloCheckoutParams;
  containerId: string;
  config: FormConfig;
}) {
  const {
    formPayload,
    providerConfig,
    subscriberId,
    params,
    config,
    containerId,
  } = payload;
  try {
    const providerKey = PaymentProvider.APPLE_PAY;
    const paymentRequestPayload = JSON.parse(JSON.stringify(providerConfig?.requestPayload));
    const transactionId = providerConfig?.transactionId;
    const ApplePaySession = (globalThis as any)?.ApplePaySession;

    const session = new ApplePaySession(2, paymentRequestPayload);

    session.onvalidatemerchant = async (event: any) => {
      const sessionUrl = event.validationURL;
      const { result, meta } = await API.post("/payment/session", { providerKey, sessionUrl, transactionId });
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
        handleCheckoutResponse({
          checkoutResponse,
          params,
          config,
          containerId,
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

    // Register user
    await registerPaymentUser(subscriberId, config, params);

    // Show apple pay modal
    session.begin();
  } catch (error: any) {
    params.events?.onFail?.({ message: error || "Apple Pay payment process failed", data: {}});
  }
}

function handleGooglePayPayment() {
  // TODO: Google Pay payment handling
}

export async function sendPayment(paymentParams: {
  providerKey: PaymentProvider;
  formData: Record<string, any>;
  params: IZotloCheckoutParams;
  config: FormConfig;
  containerId: string;
  providerConfigs: Record<string, any>;
}) {
  const { providerKey, formData, params, config, containerId, providerConfigs } = paymentParams;
  try {
    const { subscriberId = "" } = formData || {};

    const payload = preparePayload(providerKey, formData, params);
    if (providerKey === PaymentProvider.APPLE_PAY) return handleApplePayPayment({ 
      formPayload: payload, 
      providerConfig: providerConfigs?.applePay, 
      subscriberId, 
      params,
      config,
      containerId 
    });
    if (providerKey === PaymentProvider.GOOGLE_PAY) return handleGooglePayPayment();

    // Register user
    await registerPaymentUser(subscriberId, config, params);
    
    // Send payment
    const checkoutResponse = await API.post("/payment/checkout", payload);
    handleCheckoutResponse({ checkoutResponse, params, containerId, config });

  } catch (err:any) {
    params.events?.onFail?.({ message: err?.meta?.message, data: err?.meta });
  }
}
