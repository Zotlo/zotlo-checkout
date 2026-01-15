import { getCDNUrl } from "../utils/getCDNUrl";

export const FORM_ITEMS = {
  CARD_NUMBER: {
    label: 'Card Number',
    input: {
      type: 'card',
      name: 'cardNumber',
      placeholder: 'Card number',
      inputmode: 'numeric',
      'data-rules': 'required|card',
      'data-mask': '#### #### #### ####',
    },
  },
  CARD_HOLDER: {
    label: 'Card Holder\'s Name',
    input: {
      name: 'cardHolder',
      'data-rules': 'required',
      placeholder: 'Name on card',
    }
  },
  EXPIRATION_DATE: {
    label: 'Expiration Date',
    input: {
      name: 'cardExpiration',
      placeholder: 'MM/YY',
      inputmode: 'numeric',
      'data-rules': 'required|expirationDate',
      'data-mask': '##/##',
    }
  },
  SECURITY_CODE: {
    label: 'Security Code',
    hint: `<div style="width:104px;display:flex;justify-content:center;gap:8px;">
    <img src="${getCDNUrl('cards/cvv.svg')}" style="width:48px;" alt="CVV">
    <img src="${getCDNUrl('cards/cvvAmex.svg')}" style="width:48px;" alt="CVV Amex">
    </div>`,
    input: {
      name: 'cardCVV',
      placeholder: 'CVV',
      inputmode: 'numeric',
      'data-rules': 'required|min:3',
      'data-mask': '###',
    }
  },
  SUBSCRIBER_ID_EMAIL: {
    label: 'E-mail Address',
    input: {
      name: 'subscriberId',
      type: 'email',
      'data-rules': 'required|email',
      placeholder: 'Write your email address'
    }
  },
  SUBSCRIBER_ID_PHONE: {
    label: 'Phone Number',
    defaultCountryCode: 'TR',
    input: {
      name: 'subscriberId',
      type: 'phone',
      placeholder: 'Write your phone number',
      'data-rules': 'required|phone',
      'data-mask': '+90 (###)###-####',
    }
  },
  ZIP_CODE: {
    label: 'Zip Code',
    input: {
      name: 'zipCode',
      type: 'text',
      placeholder: 'ZIP CODE',
      'data-rules': 'required|zipCode',
      'data-mask': /^[\d-]*$/,
    }
  },
  BILLING_ACTIVATE: {
    label: "I'm purchasing as a business",
    className: 'zotlo-checkout__agreement',
    input: {
      name: 'billingAsBusiness'
    }
  },
  BILLING_BUSINESS_NAME: {
    label: 'Business Name',
    input: {
      name: 'billingBusinessName',
      type: 'text',
      placeholder: 'Business name',
      'data-rules': 'required',
    }
  },
  BILLING_ADDRESS_LINE: {
    label: 'Address Line',
    input: {
      name: 'billingAddressLine',
      type: 'text',
      placeholder: 'Address line',
      'data-rules': 'required',
    }
  },
  BILLING_CITY_TOWN: {
    label: 'City/Town',
    input: {
      name: 'billingCityTown',
      type: 'text',
      placeholder: 'City/Town',
      'data-rules': 'required',
    }
  },
  BILLING_TAX_ID: {
    label: 'Tax ID',
    input: {
      name: 'billingTaxId',
      type: 'text',
      placeholder: 'Tax ID',
      'data-rules': '', // This will validate next phase on utils/validation.ts#97
    }
  },
  AGREEMENT_CHECKBOX: {
    label: 'I read and agree to <a target="_blank" href="#">distance sales agreement</a> and <a href="#" target="_blank">information form</a>',
    className: 'zotlo-checkout__agreement',
    input: {
      name: 'acceptPolicy',
      'data-rules': 'required',
    }
  },
  SAVE_CARD_CHECKBOX: {
    label: 'Pay faster next time with this card',
    className: 'zotlo-checkout__save-card',
    input: {
      name: 'saveCard',
    }
  }
}
