import { FormDesign, FormGeneral, FormSuccess } from "../lib/types";

export const DefaultThemeConfig: {
  general: Partial<FormGeneral>;
  design: FormDesign;
  success: FormSuccess;
} = {
  general: {
    localization: {
      empty: {
        noMethod: {
          title: 'An error occured',
          desc: 'Cannot load form, please try again later.',
        }
      }
    }
  },
  success: {
    show: true,
    waitTime: 10,
    autoRedirect: true,
    color: "#151B26",
    theme: "app2web",
    genericButton: {
      show: true,
      text: 0
    },
    storeButtons: {
      google: true,
      apple: true,
      amazon: false,
      microsoft: false,
      huawei: false
    },
    button: {
      color: "#FFFFFF",
      backgroundColor: "#765EF5",
      borderColor: "#765EF5",
      borderRadius: "8",
      borderWidth: "0",
      hover: {
        color: "#FFFFFF",
        borderColor: "#765EF5",
        backgroundColor: "#765EF5"
      },
      text: 0,
      textStyle: {
        bold: true,
        italic: false,
        underline: false
      }
    }
  },
  design: {
    theme: "mobileapp",
    fontFamily: "Montserrat, sans-serif",
    backgroundColor: "#FFFFFF",
    borderColor: "#E7EAEE",
    borderRadius: "8",
    borderWidth: "1",
    darkMode: false,
    label: {
      show: false,
      color: "#151B26",
      fontSize: "14",
      textStyle: {
        bold: true,
        italic: false,
        underline: false
      }
    },
    consent: {
      color: "#151B26",
      fontSize: "14",
      textStyle: {
        bold: true,
        italic: false,
        underline: false
      }
    },
    totalPriceColor: "#151B26",
    button: {
      color: "#FFFFFF",
      backgroundColor: "#765EF5",
      borderColor: "#765EF5",
      borderRadius: "8",
      borderWidth: "0",
      hover: {
        color: "#FFFFFF",
        borderColor: "#765EF5",
        backgroundColor: "#765EF5"
      },
      text: {
        trialActivationState: 0,
        subscriptionActivationState: 0,
        onetimePayment: 0
      },
      textStyle: {
        bold: true,
        italic: false,
        underline: false
      }
    },
    footer: {
      showMerchantDisclaimer: false,
      color: "#737380",
      fontSize: "10"
    },
    header: {
      show: true,
      close: {
        show: false,
        url: ""
      }
    },
    product: {
      discountRate: 0,
      showProductTitle: true,
      showSubtotalText: true,
      productImage: {
        show: true,
        url: ""
      },
      additionalText: {
        show: true,
        text: {
          en: "Bonus +5%"
        }
      }
    }
  }
}
