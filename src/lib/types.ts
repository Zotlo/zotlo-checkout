export interface IZotloCheckoutParams {
  token: string;
  packageId: string;
  events?: {
    onLoad?: () => void;
    onUpdate?: () => void;
    onSubmit?: () => void;
  }
}

export interface IZotloCheckoutReturn {
  mount: (containerId: string) => void;
  refresh: () => void;
  unmount: () => void;
}

type TextStyle = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export type FormDesign = {
  theme: 'horizontal' | 'vertical';
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

export type FormSetting = {
  sendMailOnSuccess: boolean;
  paymentMethodSetting: {
    providerKey: 'paypal' | 'creditCard' | 'googlePay' | 'applePay' | 'stripe';
    status: 'active' | 'passive' | 'pending';
    countries?: string[];
  }[];
  registerType: 'email' | 'phoneNumber';
  allowSubscriberIdEditing: boolean;
};

export type FormConfig = {
  general: {
    isLive: boolean;
    showPaypal: boolean;
    language: string;
    countryCode: string;
    currency: string;
    localization: Record<string, any>;
  };
  settings: FormSetting;
  design: FormDesign;
}
