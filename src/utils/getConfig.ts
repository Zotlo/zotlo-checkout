import type { FormConfig, FormSetting, FormDesign, IZotloCheckoutParams, FormPaymentData } from "../lib/types";
import { API } from "../utils/api";
import { setCookie, COOKIE } from "./cookie";

type InitResult = {
  uuid: string;
  subscriberId: string;
  registerBypass: boolean;
  language: string;
  countryCode: string;
  settings: FormDesign;
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

    config.design = initData?.settings || {};
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
      packageName: paymentInitData?.package?.name || '',
      productImage: initData?.productImage || '',
      additionalText: initData?.additionalText || '',
    };
    config.settings = {
      paymentMethodSetting: initData?.paymentMethodSetting || [],
      registerType:  initData?.registerType,
      allowSubscriberIdEditing: !!+initData?.allowSubscriberIdEditingOnRegisterPayment,
    }
    config.paymentData = paymentInitData as FormConfig["paymentData"];
  } catch {
    return config;
  }

  return config;
}
