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
  AGREEMENT_CHECKBOX: {
    label: 'I read and agree to <a target="_blank" href="#">distance sales agreement</a> and <a href="#" target="_blank">information form</a>',
    className: 'zotlo-checkout__agreement',
    input: {
      name: 'acceptPolicy',
      'data-rules': 'required',
    }
  }
}
