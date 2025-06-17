export interface IZotloCheckoutParams {
  token: string;
  packageId: string;
  language?: string;
  subscriberId?: string;
  returnUrl?: string;
  events?: {
    onLoad?: (params: Record<string, any>) => void;
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

export type ProductConfigMobileApp = {
  showProductTitle: boolean;
  showSubtotalText: boolean;
  discountRate: number;
  productImage: {
    show: boolean;
    url: string;
  };
  additionalText: {
    show: boolean;
    text: Record<string, string>;
  };
}

export type FormDesign = {
  theme: 'horizontal' | 'vertical' | 'mobileapp';
  darkMode: boolean;
  fontFamily: string;
  borderColor: string;
  backgroundColor: string;
  borderRadius: string;
  borderWidth: string;
  header: { show: boolean; };
  product: ProductConfigMobileApp;
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
  registerType: 'email' | 'phoneNumber' | 'other';
  hideSubscriberIdIfAlreadySet: boolean;
  allowSubscriberIdEditing: boolean;
};

export enum PackageType {
  SUBSCRIPTION = 'subscription',
  CONSUMABLE = 'consumable',
  EPIN = 'epin'
}

export enum TrialPackageType {
  FREE_TRIAL = 'freeTrial',
  STARTING_PRICE = 'startingPrice',
  NO = 'no'
}

export type PackageData = {
  period: number;
  name: string;
  packageId: string;
  packageType: PackageType;
  trialPeriod: number;
  periodType: string;
  trialPeriodType: string;
  trialPackageType: TrialPackageType;
};

export type SelectedPriceData = {
  type: string;
  currency: string;
  price: string;
  trialPrice: string;
  dailyPrice: string;
  weeklyPrice: string;
};

export type FormPaymentData = {
  package: PackageData;
  providers: Record<string, any>;
  sandboxPayment: boolean;
  selectedPrice: SelectedPriceData;
  subscriberCountry: string;
  discount: {
    discountPrice: number | string;
    originalPrice: number | string;
    totalPrice: number | string;
  };
  documents: {
    distanceSalesAgreement: string;
    informationForm: string;
  };
}

export type PackageInfoType = {
  price: string;
  trialPrice: string;
  dailyPrice: string;
  weeklyPrice: string;
  trialPeriod: number;
  trialPeriodType: string;
  period: number;
  periodType: string;
  totalPayableAmount: string;
  currency: string;
  condition: 'package_with_trial' | 'onetime_payment' | 'plan_with_no_trial' | 'package_with_trial_used';
  state: keyof FormConfig['design']['button']['text'];
  discount: {
    price: number | string;
    original: number | string
    total: number | string;
  }
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
  subscriberId?: string;
  registerBypass?: boolean;
  zotloUrls?: {
    privacyPolicy?: string;
    termsOfService?: string;
    cookiePolicy?: string;
  };
  documents: {
    distanceSalesAgreement: string;
    informationForm: string;
  };
}

export type FormSuccess = {
  show: boolean;
  waitTime: number;
  redirectUrl: string;
  autoRedirect: boolean;
  theme: 'app2web' | 'web2app';
  genericButton: {
    show: boolean;
    text: number | string;
  };
  storeButtons: {
    google: boolean;
    apple: boolean;
    amazon: boolean;
    microsoft: boolean;
    huawei: boolean;
  };
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

type ProviderTransactionInfo = {
  totalPrice: string;
  totalPriceStatus: string;
  currencyCode: string;
  countryCode: string;
}

type ProviderAllowedPaymentMethods = {
  type: string;
  parameters: Record<string, any>;
}

export type ProviderConfigs = {
  applePay?: {
    canMakePayments?: boolean;
    transactionId?: string;
    requestPayload: Record<string, any>;
  },
  googlePay?: {
    isReadyToPay?: boolean;
    transactionId?: string;
    transactionInfo: ProviderTransactionInfo;
    tokenization: {
      type: string;
      parameters: Record<string, any>;
    };
    isReadyToPayRequest: {
      apiVersion: number;
      apiVersionMinor: number;
      allowedPaymentMethods: ProviderAllowedPaymentMethods[];
    };
    paymentDataRequest: {
      apiVersion: number;
      apiVersionMinor: number;
      allowedPaymentMethods: ProviderAllowedPaymentMethods[];
      transactionInfo: ProviderTransactionInfo;
      merchantInfo: {
        merchantName: string;
        merchantId?: string;
      };
    };
  },
}

export type FormConfig = {
  general: FormGeneral;
  settings: FormSetting;
  design: FormDesign;
  success: FormSuccess;
  paymentData?: FormPaymentData;
  packageInfo?: PackageInfoType;
  providerConfigs?: ProviderConfigs;
}

export type PaymentDetail = {
  isSandbox: boolean;
  application: {
    id: number;
    name: string;
    zotloId: number;
    teamId: number;
    links: {
      genericDownloadUrl: string;
      appStoreUrl: string;
      googlePlayStoreUrl: string;
      amazonStoreUrl: string;
      microsoftStoreUrl: string;
      huaweiAppGalleryUrl: string;
      customerSupportUrl: string;
      privacyUrl: string;
      termsOfServiceUrl: string;
      deeplinkIos: string;
      deeplinkAndroid: string;
      deeplinkWeb: string;
    }
  };
  client: {
    selectedOs: 'android' | 'ios' | 'desktop';
    subscriberId: string;
    appToWebEmail: string;
    fullName: string | null;
    country: string;
    language: string;
  };
  payment: {
    package: {
      id: number;
      selectedCountry: string;
      period: number;
      name: string;
      packageId: string;
      packageType: string;
      trialPeriod: number;
      periodType: string;
      trialPeriodType: string;
      trialPackageType: string;
      currency: string;
      price: number;
      trialPrice: number;
      countryPrices: Record<string, {
        country: string;
        price: number;
        trialPrice: number;
        currency: string;
      }>;
    };
  };
}
