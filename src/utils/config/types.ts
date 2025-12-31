import type { FormConfig, FormDesign, FormSetting, FormSuccess } from "../../lib/types";

export type InitResult = {
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
  showSavedCards: boolean;
  quantitySetting: FormSetting["quantitySetting"];
};

export type CardInitResult = {
  uuid: string;
  localization: Record<string, any>;
  language: string;
  countryCode: string;
  privacyUrl: string;
  tosUrl: string;
  privacyAndTosUrlStatus: 1 | 0;
  appName?: string;
  subscriberId: string;
  customerSupportUrl: string;
  zotloUrls: {
    privacyPolicy?: string;
    termsOfService?: string;
    cookiePolicy?: string;
  };
};
