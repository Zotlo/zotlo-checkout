import type { FormConfig, FormSetting, FormDesign, IZotloCheckoutParams } from "../lib/types";
import { API } from "../utils/api";
import { setCookie, getCookie, COOKIE } from "./cookie";

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
};

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

  const existingUuid = getCookie(COOKIE.UUID);
  const reqConfig = { headers: { Language: language, ...(existingUuid && { Uuid: existingUuid }) } };

  try {
    const initRes = await API.post("/init", payload, reqConfig);
    const initData = initRes?.result as InitResult;
    if (!initData || Array.isArray(initData)) return config;
    setCookie(COOKIE.UUID, initData?.uuid, 30);

    const paymentRes = await API.get("/payment/init", { headers: { Uuid: initData?.uuid }});
    const paymentInitData = paymentRes?.result || {};

    config.design = initData?.settings || {};
    config.general = {
      localization: initData?.localization,
      showPaypal: initData?.showPaypal,
      language: initData?.language,
      countryCode: initData?.countryCode,
      currency: initData?.currency,
      tosUrl: initData?.tosUrl,
      privacyUrl: initData?.privacyUrl,
      privacyAndTosUrlStatus: !!+initData?.privacyAndTosUrlStatus,
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
