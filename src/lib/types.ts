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

export enum SuccessTheme {
  APP2WEB = 'app2web',
  WEB2APP = 'web2app'
}

export enum DesignTheme {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  MOBILEAPP = 'mobileapp'
}

type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export interface IZotloCheckoutStyle {
  design?: DeepPartial<Omit<FormDesign, 'footer' | 'product'> & {
    /** This available for theme mobileapp */
    product: Omit<ProductConfigMobileApp, 'discountRate'>;
    footer: Omit<FormDesign['footer'], 'showMerchantDisclaimer'>;
  }>;
  success?: DeepPartial<FormSuccess>;
}

export interface IZotloCheckoutParams {
  token: string;
  packageId: string;
  language?: string;
  subscriberId?: string;
  returnUrl?: string;
  style?: IZotloCheckoutStyle;
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
  /** If `showProductTitle` sets `false`, this will be ignored */
  showSubtotalText: boolean;
  discountRate: number;
  productImage: {
    show: boolean;
    url: string;
  };
  additionalText: {
    show: boolean;
    /** Language ISO code and its translation. (eg. `{ en: "Bonus +5%", pt_bz: "Bônus de 5%" }`) */
    text: Record<string, string>;
  };
}

export type FormDesign = {
  /** Default: `vertical` */
  theme: 'horizontal' | 'vertical' | 'mobileapp';
  darkMode: boolean;
  /** You can set any Google fonts (eg. "Montserrat", sans-serif)  */
  fontFamily: string;
  borderColor: string;
  backgroundColor: string;
  borderRadius: number | string;
  borderWidth: number | string;
  /** Available for theme mobileapp */
  header: { show: boolean; };
  product: ProductConfigMobileApp;
  label: {
    show: boolean;
    color: string;
    fontSize: number | string;
    textStyle: TextStyle;
  };
  consent: {
    color: string;
    fontSize: number | string;
    textStyle: TextStyle;
  };
  totalPriceColor: string;
  button: {
    color: string;
    borderColor: string;
    backgroundColor: string;
    borderRadius: number | string;
    borderWidth: number | string;
    textStyle: TextStyle;
    hover: {
      color: string;
      borderColor: string;
      backgroundColor: string;
    };
    text: {
      /**
       * ```
       * 0: "Start Trial"
       * 1: "Start {{TRIAL_PERIOD}} Trial"
       * ```
      */
      trialActivationState: 0 | 1 | string;
      /**
       * ```
       * 0: "Start Now"
       * 1: "Subscribe Now"
       * 2: "Get Started"
       * 3: "Activate Now"
       * 4: "Subscribe for {{PRICE}}"
       * 5: "Get Started for {{PRICE}}"
       * 6: "Subscribe Now for {{DAILY_PRICE}} per day"
       * 7: "Start Now for {{DAILY_PRICE}} per day"
       * ```
       */
      subscriptionActivationState: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | string;
      /**
       * ```
       * 0: "Buy Now"
       * 1: "Pay Now"
       * 2: "Complete Payment"
       * ```
       */
      onetimePayment: 0 | 1 | 2 | string;
    };
  };
  footer: {
    showMerchantDisclaimer: boolean;
    color: string;
    fontSize: number | string;
  };
};

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

export type PackageData = {
  period: number;
  name: string;
  packageId: string;
  packageType: PackageType;
  trialPeriod: number;
  periodType: 'year' | 'month' | 'week' | 'day';
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
  /** In seconds. Min: 5, Max: 50, Default: 10  */
  waitTime: number;
  autoRedirect: boolean;
  theme: 'app2web' | 'web2app';
  /** This is available if theme is web2app */
  genericButton: {
    show: boolean;
    /**
     * ```
     * 0: "Go to App"
     * 1: "Go to Web"
     * ```
    */
    text: 0 | 1 | string;
  };
  /** If there is no url for store button (ex. google), this button cannot visible */
  storeButtons: {
    google: boolean;
    apple: boolean;
    amazon: boolean;
    microsoft: boolean;
    huawei: boolean;
  };
  color: string;
  button: {
    /**
     * ```
     * 0: "Back to App"
     * 1: "Back to Game"
     * ```
    */
    text: 0 | 1 | string;
    color: string;
    borderColor: string;
    backgroundColor: string;
    borderRadius: number | string;
    borderWidth: number | string;
    textStyle: TextStyle;
    hover: {
      color: string;
      borderColor: string;
      backgroundColor: string;
    };
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
