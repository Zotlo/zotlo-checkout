import { handleResponseRedirection, setFormLoading, ZOTLO_GLOBAL } from "./index";
import { type FormConfig, PaymentProvider, type IZotloCheckoutParams, type IZotloCardParams, type PaymentDetail, type ProviderConfigs } from "../lib/types";
import { getGooglePayClient } from "./loadProviderSdks";
import { CheckoutAPI } from "./api";
import { deleteSession } from "./session";
import { Logger } from "../lib/logger";
import { COOKIE } from "./cookie";
import { getFormValues } from "../lib/common";
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
  const { cardExpiration, acceptPolicy = true, cardNumber, cardHolder, cardCVV, zipCode, saveCard, cardId = 0 } = formData || {};
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
        [PaymentProvider.APPLE_PAY, PaymentProvider.GOOGLE_PAY, PaymentProvider.PAYPAL].includes(providerKey)
      ) {
        (data as any).transactionId = (config?.providerConfigs as any)?.[providerKey]?.transactionId || "";
        (data as any)[`${providerKey}Token`] = 'aaaaaa';
      }
    }
      break;
    default:
      break;
  }

  if (config.design?.businessPurchase?.enabled) {
    const businessInfo = prepareBillingInfo(formData, config);
    if (businessInfo) {
      data = {
        ...data,
        businessInfo,
      }
    }
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

function handlePaymentErrorMessage(error:any, params: IZotloCheckoutParams, messageFallback?: string) {
  const message = (typeof error === 'string' ? error : error?.meta?.message) || messageFallback;
  params.events?.onFail?.({
    message,
    data: typeof error !== 'string' ? error : {}
  });
  Logger.client?.captureException(error);
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
      const { result: res, meta } = await CheckoutAPI.get("/payment/detail");
      result = res as PaymentDetail;
  
      if (meta?.errorCode) {
        params.events?.onFail?.({ message: meta?.message, data: meta });
        return null
      }
    }

    deleteSession({
      useCookie: !!params.useCookie,
      key: config.cardUpdate ? COOKIE.CARD_UUID : COOKIE.UUID
    });
    params.events?.onSuccess?.({
      ...result,
      cardUpdate: ZOTLO_GLOBAL.cardUpdate
    });
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
    handleResponseRedirection({
      response: checkoutResponse,
      params
    });
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
      const { result, meta } = await CheckoutAPI.post("/payment/session", { providerKey, sessionUrl, transactionId, returnUrl: params?.returnUrl || '' });
      if (meta?.errorCode) {
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
        const checkoutResponse = await CheckoutAPI.post("/payment/checkout", payload);
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

    const googleClientResponse = await getGooglePayClient()?.loadPaymentData(paymentDataRequest);
    const transactionId = providerConfig?.transactionId;
    const checkoutPayload = {
      ...formPayload,
      transactionId,
      googlePayToken: JSON.stringify(googleClientResponse),
    }

    const checkoutResponse = await CheckoutAPI.post("/payment/checkout", checkoutPayload);
    await handleCheckoutResponse({
      checkoutResponse,
      params,
      refreshProviderConfigsFunction,
    });
  } catch (error: any) {
    // Prevent user closing form error
    if (error?.toString()?.includes("AbortError")) return;
    handlePaymentErrorMessage(error, params, "Google Pay payment process failed");
  }
}

export async function renderPaypalButton(payload: {
  params: IZotloCheckoutParams;
  config: FormConfig;
  refreshProviderConfigs: () => Promise<void>;
  validateForm?: (providerKey: PaymentProvider) => {
    isValid: boolean;
    errors: Record<string, any>[];
  };
  forceRender?: boolean;
}) {
  const {
    params,
    config,
    refreshProviderConfigs,
    validateForm,
    forceRender = false,
  } = payload || {};

  try {
    if (!config.paymentData?.useNewPayPal) return;
    const paypal = (window as any)?.paypal;
    const paypalButtonContainer = document.getElementById('paypal-button');
    if (!paypalButtonContainer) return;
    const hasExistingButton = paypalButtonContainer?.childElementCount > 0;
    if ((hasExistingButton && !forceRender) || !paypal) return;
    paypalButtonContainer.innerHTML = '';

    const paypalConfig = config?.providerConfigs?.[PaymentProvider.PAYPAL];
    const transactionId = paypalConfig?.transactionId;
    const returnUrl = params?.returnUrl || '';
    let subscriberId = "";
    let formPayload = {} as any;
    paypal.Buttons({
      style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          tagline: false,
          borderRadius: 8,
          disableMaxHeight: true,
      },
      fundingSource: paypal.FUNDING.PAYPAL,
      createBillingAgreement: async function (_data:any, _actions:any) {
        try {
          const { result, meta } = await CheckoutAPI.post("/payment/authorize", { transactionId, returnUrl, providerKey: PaymentProvider.PAYPAL });
          if (meta?.errorCode) return params?.events?.onFail?.({ message: meta?.message, data: meta });
          return result?.tokenId;
        } catch (error) {
          handlePaymentErrorMessage(error, params, "Paypal button process failed on createBillingAgreement");
        }
      },
      onClick: async function (_data:any, actions:any) {
        const validation = validateForm?.(PaymentProvider.PAYPAL);
        if (!validation?.isValid) return actions.reject();
        setFormLoading(true);
        const formData = getFormValues(config) || {};
        formPayload = preparePayload({ providerKey: PaymentProvider.PAYPAL, formData, params, config });
        subscriberId = formData?.subscriberId || "";

        const registerResponse = await registerPaymentUserIfNecessary(subscriberId, config, params);
        if (registerResponse?.meta?.errorCode) {
          setFormLoading(false);
          return actions.reject();
        }

        const isSandboxPayment = !!config?.paymentData?.sandboxPayment;
        if (isSandboxPayment) {
          const checkoutResponse = await CheckoutAPI.post("/payment/checkout", formPayload);
          await handleCheckoutResponse({
            checkoutResponse, 
            params, 
            refreshProviderConfigsFunction: refreshProviderConfigs 
          });
          setFormLoading(false);
          return actions.reject();
        }

        return actions.resolve();
      },
      onApprove: async function (paypalData:any) {
        const checkoutPayload = {
          ...formPayload,
          transactionId,
          paypalToken: JSON.stringify(paypalData),
        };
        try {
          const checkoutResponse = await CheckoutAPI.post("/payment/checkout", checkoutPayload);
          await handleCheckoutResponse({
            checkoutResponse,
            params,
            refreshProviderConfigsFunction: refreshProviderConfigs,
          });
        } finally {
          setFormLoading(false);
        }
      },
      onError: function (err:any) {
        setFormLoading(false);
        handlePaymentErrorMessage(err, params, "Paypal buttons error occurred");
      },
      onCancel() {
        setFormLoading(false);
      }
    }).render('#paypal-button');
  } catch (err: any) {
    handlePaymentErrorMessage(err, params, "Paypal buttons error caught");
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
