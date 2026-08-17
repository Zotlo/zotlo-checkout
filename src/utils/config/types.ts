import type { FormConfig, FormDesign, FormPostPaymentOffers, FormSetting, FormSuccess } from "../../lib/types";

export type InitResult = {
  uuid: string;
  subscriberId: string;
  registerBypass: boolean;
  language: string;
  countryCode: string;
  statementName: string;
  ia: string;
  settings: {
    design: FormDesign;
    success: FormSuccess;
    postPaymentOffers?: FormPostPaymentOffers;
  };
  paymentMethodSetting: FormSetting["paymentMethodSetting"];
  registerType: FormSetting["registerType"];
  allowSubscriberIdEditingOnRegisterPayment: string;
  hideSubscriberIdIfAlreadySet: string;
  privacyAndTosUrlStatus: number;
  isCheckoutLink: boolean;
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
  isActiveFTC?: boolean;
  zotloUrls: {
    privacyPolicy?: string;
    termsOfService?: string;
    cookiePolicy?: string;
  };
  integrations?: FormConfig['integrations'];
  showSavedCards: boolean;
  quantitySetting: FormSetting["quantitySetting"];
  enableDiscountCodeEntry: boolean;
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

export const ErrorCodes = {
  NO_PROVIDER_AVAILABLE: '404039'
}
