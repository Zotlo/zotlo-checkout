import { ErrorHandler } from "./index";
import { mergeDeep, ZOTLO_GLOBAL } from "../index";
import { DesignTheme, PaymentProvider, type FormConfig, type FormDesign, type FormSuccess, type IZotloCheckoutParams } from "../../lib/types";
import { CardAPI } from "../api";
import { DefaultThemeConfig } from "../getDefaultThemeConfig";
import { setSession } from "../session";
import type { CardInitResult } from "./types";
import { Logger } from "../../lib/logger";
import { COOKIE } from "../cookie";

export async function getCardConfig(params: IZotloCheckoutParams): Promise<FormConfig> {
  ZOTLO_GLOBAL.cardUpdate = true;

  const config = {
    cardUpdate: ZOTLO_GLOBAL.cardUpdate,
    general: DefaultThemeConfig.general,
    design: DefaultThemeConfig.design,
    success: DefaultThemeConfig.success,
    integrations: {},
    settings: {},
    paymentData: {
      providers: {
        [PaymentProvider.CREDIT_CARD]: true
      }
    },
    packageInfo: {
      totalPayableAmount: '0.00',
      discount: {
        price: 0,
        original: 0,
        total: 0
      }
    },
    customerSupportUrl: '',
  } as FormConfig;

  const {
    token,
    packageId,
    language = navigator.language?.split("-")?.[0] || "en",
    subscriberId,
    customParameters,
    useCookie = false,
  } = params || {};

  const payload = {
    token,
    packageId,
    subscriberId,
    ...(customParameters && typeof customParameters === 'object' && { customParameters: JSON.stringify(customParameters) }),
  };

  const reqConfig = { headers: { Language: language } };

  try {
    const initRes = await CardAPI.post('/card/init', payload, reqConfig);
    const initData = initRes?.result as CardInitResult;
    if (!initData || Array.isArray(initData)) return config;
    setSession({ id: initData?.uuid, expireTimeInMinutes: 30, useCookie, key: COOKIE.CARD_UUID });

    config.customerSupportUrl = initData?.customerSupportUrl || '';

    config.design = mergeDeep(
      DefaultThemeConfig.design,
      (params.style?.design || {} as FormDesign),
      {
        theme: DesignTheme.MOBILEAPP,
        consent: DefaultThemeConfig.design.consent,
        totalPriceColor: DefaultThemeConfig.design.totalPriceColor,
        button: {
          ...DefaultThemeConfig.design.button,
          text: {}
        },
        footer: {
          showMerchantDisclaimer: false
        }
      }
    ) as FormDesign;

    config.success = mergeDeep(
      DefaultThemeConfig.success,
      (params.style?.success || {} as FormSuccess),
      {
        waitTime: DefaultThemeConfig.success.waitTime,
        autoRedirect: false,
        theme: DefaultThemeConfig.success.theme,
        storeButtons: {},
        genericButton: {
          show: true,
        },
        button: {
          text: '',
        }
      } as FormSuccess
    ) as FormSuccess;

    config.general = {
      showPaypal: false,
      localization: initData?.localization || config.general.localization,
      language: initData?.language,
      countryCode: initData?.countryCode,
      currency: '',
      tosUrl: initData?.tosUrl,
      privacyUrl: initData?.privacyUrl,
      privacyAndTosUrlStatus: !!+initData?.privacyAndTosUrlStatus,
      isPolicyRequired: false,
      isZipcodeRequired: false,
      appName: initData?.appName || '',
      subscriberId: initData?.subscriberId || '',
      registerBypass: false,
      zotloUrls: {
        privacyPolicy: initData?.zotloUrls?.privacyPolicy || '',
        termsOfService: initData?.zotloUrls?.termsOfService || '',
        cookiePolicy: initData?.zotloUrls?.cookiePolicy || '',
      },
      documents: {
        distanceSalesAgreement: '',
        informationForm: ''
      },
      showSavedCards: false,
    };
    config.settings = {
      paymentMethodSetting: [{ providerKey: PaymentProvider.CREDIT_CARD }],
      registerType: 'email',
      allowSubscriberIdEditing: false,
      hideSubscriberIdIfAlreadySet: true,
    }
  } catch (e: any) {
    ErrorHandler.response = e;
    Logger.client?.captureException(e);
    return config;
  }

  return config;
}
