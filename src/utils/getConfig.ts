import type { FormConfig, FormSetting, FormDesign, IZotloCheckoutParams, FormPaymentData, FormSuccess } from "../lib/types";
import { PaymentProvider } from "../lib/types";
import { API } from "../utils/api";
import { setCookie, COOKIE } from "./cookie";

type InitResult = {
  uuid: string;
  subscriberId: string;
  registerBypass: boolean;
  language: string;
  countryCode: string;
  settings: {
    design: FormDesign;
    success: FormSuccess;
  };
  paymentMethodSetting: FormSetting["paymentMethodSetting"];
  registerType: FormSetting["registerType"];
  allowSubscriberIdEditingOnRegisterPayment: string;
  privacyAndTosUrlStatus: number;
  privacyUrl: string;
  tosUrl: string;
  localization: Record<string, any>;
  showPaypal: boolean;
  currency: string;
  isPolicyRequired: boolean;
  appName?: string;
  appLogo?: string;
  productImage?: string;
  additionalText?: string;
  packageName?: string;
  customPrice?: string;
  customCurrency?: string;
};

async function getPaymentData() {
  try {
    const paymentRes = await API.get("/payment/init");
    const paymentInitData = paymentRes?.result || {};
    return paymentInitData as FormPaymentData;
  } catch {
    return {} as FormPaymentData;
  }
}

export async function getConfig(params: IZotloCheckoutParams): Promise<FormConfig> {
  const config = { general: {}, settings: {}, design: {}, paymentData: {} } as FormConfig;

  const {
    token,
    packageId,
    language = navigator.language?.split("-")?.[0] || "en",
    subscriberId,
  } = params || {};

  const payload = {
    applicationHash: token,
    packageId,
    ...(subscriberId && { subscriberId }),
  };

  const reqConfig = { headers: { Language: language } };

  try {
    const initRes = await API.post("/init", payload, reqConfig);
    const initData = initRes?.result as InitResult;
    if (!initData || Array.isArray(initData)) return config;
    const pathName = globalThis?.location?.pathname || "/";
    setCookie(COOKIE.UUID, initData?.uuid, 30, pathName);

    const paymentInitData = await getPaymentData();
    const settings = initData?.settings;

    config.design = (settings?.design ? settings.design : (settings as any)) || {};
    config.success = settings?.success || {};

    config.general = {
      localization: initData?.localization,
      showPaypal: !!paymentInitData?.providers?.paypal,
      language: initData?.language,
      countryCode: initData?.countryCode,
      currency: initData?.currency,
      tosUrl: initData?.tosUrl,
      privacyUrl: initData?.privacyUrl,
      privacyAndTosUrlStatus: !!+initData?.privacyAndTosUrlStatus,
      isPolicyRequired: initData?.isPolicyRequired,
      appName: initData?.appName || '',
      appLogo: initData?.appLogo || '',
      packageName: initData?.packageName || paymentInitData?.package?.name || '',
      productImage: initData?.productImage || '',
      additionalText: initData?.additionalText || '',
      customPrice: initData?.customPrice || '',
      customCurrency: initData?.customCurrency || ''
    };
    config.settings = {
      paymentMethodSetting: initData?.paymentMethodSetting || [],
      registerType: initData?.registerType,
      allowSubscriberIdEditing: !!+initData?.allowSubscriberIdEditingOnRegisterPayment,
    }
    config.paymentData = paymentInitData as FormConfig["paymentData"];
  } catch {
    return config;
  }

  return config;
}

export async function getProviderConfig(providerKey: PaymentProvider) {
  try {
    const res = await API.post(`/payment/init`, { providerKey });
    const data = res?.result || {};
    return data;
  } catch {
    return {};
  }
}

export async function getProvidersConfigData(paymentInitData?:FormPaymentData) {
  const { providers = {} } = paymentInitData || {};
  const providersHasConfig = [PaymentProvider.APPLE_PAY, PaymentProvider.GOOGLE_PAY];
  const providerKeys = providersHasConfig.filter(key => !!providers[key]);
  if (!providerKeys?.length) return {};
  const promises = providerKeys.map((providerKey) => getProviderConfig(providerKey as PaymentProvider));
  const results = await Promise.all(promises);
  const reducedObj = results.reduce((acc, result, index) => {
    const key = providerKeys?.[index];
    const returnObj = { 
      ...result,
      configs: {
        ...acc.configs,
        [key]: {
          ...result?.configs?.[key],
          transactionId: result?.transactionId,
        },
      },
    } as any;
    // transactionId is different for each provider in configs key
    delete returnObj?.transactionId;
    return returnObj;
  }, {configs: {}} as Record<string, any>);
  return reducedObj;
}

export async function getProvidersConfig(paymentInitData?: FormPaymentData, countryCode?: string) {
  if (!paymentInitData) return {};
  const configData = await getProvidersConfigData(paymentInitData);
  const isGooglePayProd = import.meta.env.VITE_GOOGLE_PAY_ENVIRONMENT === "PRODUCTION";

  const { currency, price, merchantId = '', appName = '' } = configData || {};
  // Apple Pay
  const applePayConfig = configData?.configs?.applePay || {};
  const applePayParams = configData?.configs?.applePay?.parameters || {};
  // Google Pay
  const googlePayConfig = configData?.configs?.googlePay || {};
  const googlePayTokenizationSpecification = googlePayConfig?.tokenizationSpecification || {};
  const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
  };
  const baseCardPaymentMethod = {
    type: googlePayConfig?.type,
    parameters: googlePayConfig?.parameters
  };
  const cardPaymentMethod = {
    ...baseCardPaymentMethod,
    tokenizationSpecification: googlePayTokenizationSpecification
  };
  const transactionInfo = {
    countryCode,
    currencyCode: currency,
    totalPriceStatus: 'FINAL',
    totalPrice: price
  }

  return {
    [PaymentProvider.APPLE_PAY]: {
      requestPayload: {
        ...applePayParams,
        currencyCode: currency,
        total: {
          label: appName,
          amount: price
        }
      },
      transactionId: applePayConfig?.transactionId,
    },
    [PaymentProvider.GOOGLE_PAY]: {
      isReadyToPayRequest: {
        ...baseRequest,
        allowedPaymentMethods: [baseCardPaymentMethod]
      },
      transactionInfo,
      paymentDataRequest: {
        ...baseRequest,
        transactionInfo,
        merchantInfo: {
          merchantName: appName,
          ...(isGooglePayProd && { merchantId })
        },
        allowedPaymentMethods: [cardPaymentMethod]
      },
      tokenization: googlePayTokenizationSpecification,
      transactionId: googlePayConfig?.transactionId,
    }
  }
}