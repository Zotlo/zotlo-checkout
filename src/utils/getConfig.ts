import { mergeDeep } from "./index";
import type { FormConfig, FormSetting, FormDesign, IZotloCheckoutParams, FormPaymentData, FormSuccess, ProviderConfigs } from "../lib/types";
import { DesignTheme, PaymentProvider, SuccessTheme } from "../lib/types";
import { API } from "../utils/api";
import { setCookie, COOKIE } from "./cookie";
import { getPackageInfo } from "./getPackageInfo";

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
  hideSubscriberIdIfAlreadySet: string;
  privacyAndTosUrlStatus: number;
  privacyUrl: string;
  tosUrl: string;
  localization: Record<string, any>;
  showPaypal: boolean;
  currency: string;
  isPolicyRequired: boolean;
  isZipcodeRequired: boolean;
  appName?: string;
  appLogo?: string;
  productImage?: string;
  additionalText?: string;
  packageName?: string;
  customPrice?: string;
  customCurrency?: string;
  zotloUrls: {
    privacyPolicy?: string;
    termsOfService?: string;
    cookiePolicy?: string;
  };
  integrations?: FormConfig['integrations'];
};

export const ErrorHandler = {
  response: null as Record<string, any> | null,
}

export async function getPaymentData(uuid?: string) {
  try {
    // Pass uuid manually in header if available.
    const config = uuid
      ? { headers: { Uuid: uuid || '' } }
      : undefined;
    const paymentRes = await API.get('/payment/init', config);
    const paymentInitData = paymentRes?.result || {};
    return paymentInitData as FormPaymentData;
  } catch (e: any) {
    ErrorHandler.response = e;
    return {} as FormPaymentData;
  }
}

export async function getConfig(params: IZotloCheckoutParams): Promise<FormConfig> {
  const config = { general: {
    localization: {
      empty: {
        noMethod: {
          title: 'An error occured',
          desc: 'Cannot load form, please try again later.',
        }
      }
    } as any
  }, settings: {}, design: {}, paymentData: {}, packageInfo: {} } as FormConfig;

  const {
    token,
    packageId,
    language = navigator.language?.split("-")?.[0] || "en",
    subscriberId,
    customParameters
  } = params || {};

  const payload = {
    applicationHash: token,
    packageId,
    ...(subscriberId && { subscriberId }),
    ...(customParameters && typeof customParameters === 'object' && { customParameters: JSON.stringify(customParameters) }),
  };

  const reqConfig = { headers: { Language: language } };

  try {
    const initRes = await API.post("/init", payload, reqConfig);
    const initData = initRes?.result as InitResult;
    if (!initData || Array.isArray(initData)) return config;
    const pathName = globalThis?.location?.pathname || "/";
    setCookie(COOKIE.UUID, initData?.uuid, 30, pathName);

    // Sometimes uuid cannot found on uuid cookie when loading form for the first time.
    // Thats why we pass uuid manually in header to get payment init data.
    const paymentInitData = await getPaymentData(initData?.uuid);
    const settings = initData?.settings;

    config.integrations = initData?.integrations || {} as InitResult['integrations'];

    config.design = mergeDeep(
      {
        ...((settings?.design ? settings.design : (settings as any)) || {}),
        theme: settings?.design?.theme || DesignTheme.VERTICAL
      },
      {
        ...(params.style?.design || {}),
        footer: {
          ...(params.style?.design?.footer || {}),
          showMerchantDisclaimer: !!settings?.design?.footer?.showMerchantDisclaimer
        }
      }
    ) as FormDesign;

    config.success = mergeDeep(
      {
        ...(settings?.success || {}),
        theme: settings?.success?.theme || SuccessTheme.APP2WEB
      },
      params.style?.success || {}
    ) as FormSuccess;

    config.general = {
      localization: initData?.localization || config.general.localization,
      showPaypal: !!paymentInitData?.providers?.paypal,
      language: initData?.language,
      countryCode: initData?.countryCode,
      currency: initData?.currency,
      tosUrl: initData?.tosUrl,
      privacyUrl: initData?.privacyUrl,
      privacyAndTosUrlStatus: !!+initData?.privacyAndTosUrlStatus,
      isPolicyRequired: initData?.isPolicyRequired,
      isZipcodeRequired: initData?.isZipcodeRequired,
      appName: initData?.appName || '',
      appLogo: initData?.appLogo || '',
      packageName: initData?.packageName || '',
      productImage: initData?.productImage || '',
      additionalText: initData?.additionalText || '',
      customPrice: initData?.customPrice || '',
      customCurrency: initData?.customCurrency || '',
      subscriberId: initData?.subscriberId || '',
      registerBypass: !!+initData?.registerBypass,
      zotloUrls: {
        privacyPolicy: initData?.zotloUrls?.privacyPolicy || '',
        termsOfService: initData?.zotloUrls?.termsOfService || '',
        cookiePolicy: initData?.zotloUrls?.cookiePolicy || '',
      },
      documents: paymentInitData?.documents || {}
    };
    config.settings = {
      paymentMethodSetting: initData?.paymentMethodSetting || [],
      registerType: initData?.registerType,
      allowSubscriberIdEditing: !!+initData?.allowSubscriberIdEditingOnRegisterPayment,
      hideSubscriberIdIfAlreadySet: !!+initData?.hideSubscriberIdIfAlreadySet,
    }
    config.paymentData = paymentInitData;
    config.packageInfo = getPackageInfo(config);
  } catch (e: any) {
    ErrorHandler.response = e;
    return config;
  }

  return config;
}

export async function getProviderConfig(providerKey: PaymentProvider, returnUrl: string) {
  try {
    const res = await API.post(`/payment/init`, { providerKey, returnUrl });
    const data = res?.result || {};
    return data;
  } catch (e: any) {
    ErrorHandler.response = e;
    return {};
  }
}

export async function getProvidersConfigData(paymentInitData:FormPaymentData, returnUrl: string) {
  const { providers = {} as Record<PaymentProvider, boolean> } = paymentInitData || {};
  const providersHasConfig = [PaymentProvider.APPLE_PAY, PaymentProvider.GOOGLE_PAY];
  const providerKeys = providersHasConfig.filter(key => !!providers[key]);
  if (!providerKeys?.length) return {};
  const promises = providerKeys.map((providerKey) => getProviderConfig(providerKey as PaymentProvider, returnUrl));
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

export async function getProvidersConfig(paymentInitData: FormPaymentData, returnUrl: string, countryCode?: string) {
  if (!paymentInitData) return {};
  const configData = await getProvidersConfigData(paymentInitData, returnUrl);
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
  } as ProviderConfigs
}