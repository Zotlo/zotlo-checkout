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

type FormDesign = {
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
      trialActivationState: string;
      subscriptionActivationState: string;
      onetimePayment: string;
    }
  },
  footer: {
    showMerchantDisclaimer: boolean;
    color: string;
    fontSize: string;
  }
};

type FormSetting = {
  sendMailOnSuccess: boolean;
  paymentMethods: string[];
  registration: 'email' | 'phoneNumber';
  allowSubscriberIdEditing: boolean;
};

export type FormConfig = {
  settings: FormSetting;
  design: FormDesign;
}
