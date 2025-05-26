export interface IZotloCheckoutParams {
  token: string;
  packageId: string;
  language?: string;
  subscriberId?: string;
  returnUrl?: string;
  events?: {
    onLoad?: () => void;
    onUpdate?: () => void;
    onSubmit?: (e?: Record<string, any>) => void;
    onSuccess?: () => void;
    onFail?: (e?: FailEventData) => void;
  }
}

export interface IZotloCheckoutReturn {
  mount: (containerId: string) => void;
  refresh: () => void;
  unmount: () => void;
}

interface FailEventData {
  message?: string;
  data: Record<string, any>;
}

type TextStyle = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export type FormDesign = {
  theme: 'horizontal' | 'vertical' | 'mobileapp';
  darkMode: boolean;
  fontFamily: string;
  borderColor: string;
  backgroundColor: string;
  borderRadius: string;
  borderWidth: string;
  label: {
    show: boolean;
    color: string;
    fontSize: string
    textStyle: TextStyle;
  },
  consent: {
    color: string;
    fontSize: string;
    textStyle: TextStyle;
  },
  totalPriceColor: string;
  button: {
    color: string;
    borderColor: string;
    backgroundColor: string;
    borderRadius: string;
    borderWidth: string;
    textStyle: TextStyle;
    hover: {
      color: string;
      borderColor: string;
      backgroundColor: string;
    },
    text: {
      trialActivationState: number | string;
      subscriptionActivationState: number | string;
      onetimePayment: number | string;
    }
  },
  footer: {
    showMerchantDisclaimer: boolean;
    color: string;
    fontSize: string;
  }
};

export enum PaymentProvider {
  PAYPAL = 'paypal',
  GOOGLE_PAY = 'googlePay',
  APPLE_PAY = 'applePay',
  CREDIT_CARD = 'creditCard'
};

export enum PaymentResultStatus {
  REDIRECT = 'REDIRECT',
  COMPLETE = 'COMPLETE'
}

export enum PaymentCallbackStatus {
  SUCCESS = 'success',
  FAIL = 'fail'
}

export type FormSetting = {
  sendMailOnSuccess?: boolean;
  paymentMethodSetting: {
    providerKey: PaymentProvider;
    countries?: string[];
  }[];
  registerType: 'email' | 'phoneNumber';
  allowSubscriberIdEditing: boolean;
};

export type FormPaymentData = {
  package: Record<string, any>;
  providers: Record<string, any>;
  selectedPrice: Record<string, any>;
  subscriberCountry: string;
}

export type FormGeneral = {
  isLive?: boolean;
  showPaypal: boolean;
  language: string;
  countryCode: string;
  currency: string;
  localization: Record<string, any>;
  tosUrl: string;
  privacyUrl: string;
  privacyAndTosUrlStatus: boolean;
  isPolicyRequired: boolean;
  appLogo?: string;
  appName?: string;
  productImage?: string;
  packageName?: string;
  additionalText?: string;
  customPrice?: string;
  customCurrency?: string;
}

export type FormSuccess = {
  show: boolean;
  waitTime: number;
  redirectUrl: string;
  autoRedirect: boolean;
  color: string;
  button: {
    color: string;
    borderColor: string;
    backgroundColor: string;
    borderRadius: string;
    borderWidth: string;
    textStyle: TextStyle;
    hover: {
      color: string;
      borderColor: string;
      backgroundColor: string;
    },
    text: number | string;
  }
}

export type FormConfig = {
  general: FormGeneral;
  settings: FormSetting;
  design: FormDesign;
  success: FormSuccess;
  paymentData?: FormPaymentData;
}
