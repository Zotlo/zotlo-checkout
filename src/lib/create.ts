import form from '../html/form.html'
import inputElement from '../html/input.html'
import checkboxElement from '../html/checkbox.html'
import buttonElement from '../html/button.html'

function generateAttributes(attrs: Record<string, string | number | boolean>) {
  if (!attrs) return '';
  return Object.entries(attrs).map(([key, value]) => value !== undefined && value !== null ? `${key}="${value}"` : '').join(' ')
}

export const FORM_ITEMS = {
  CARD_NUMBER: {
    label: 'Card Number',
    input: {
      name: 'cardNumber',
      placeholder: 'Card number',
      'data-rules': 'required|minLength:19',
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
      'data-rules': 'required|expirationDate',
      'data-mask': '##/##',
    }
  },
  SECURITY_CODE: {
    label: 'Security Code',
    input: {
      name: 'cardCVV',
      placeholder: 'CVV',
      'data-rules': 'required',
      'data-mask': '###',
    }
  },
  SUBSCRIBER_ID: {
    label: 'E-mail Address',
    input: {
      name: 'subscriberId',
      type: 'email',
      'data-rules': 'required|email',
      placeholder: 'Write your email address'
    }
  },
  AGREEMENT_CHECKBOX: {
    label: `I read and agree to <a target="_blank" href="#">distance sales agreement</a> and <a href="#" target="_blank">information form</a>`,
    input: {
      name: 'acceptPolicy',
      'data-rules': 'required',
    }
  }
}

export function createInput(payload: {
  label: string;
  message?: string;
  className?: string;
  attrs?: Record<string, string | number | boolean>;
  input: {
    name: string;
    type?: string;
    value?: string;
    placeholder?: string;
  } & Record<string, any>;
}) {
  const inputAttrs = generateAttributes({
    ...(payload.input || {}),
    ...(payload?.input?.disabled ? { disabled: '' } : {})
  });

  const inputWrapperClassName = payload?.input?.disabled
    ? 'disabled'
    : ''

  return inputElement
    .replace(/\{\{TYPE\}\}/gm, payload.input.type || 'text')
    .replace(/\{\{CLASS_NAME\}\}/gm, payload.className || '')
    .replace(/\{\{ATTRIBUTES\}\}/gm, generateAttributes(payload.attrs || {}))
    .replace(/\{\{LABEL\}\}/gm, payload.label)
    .replace(/\{\{INPUT_WRAPPER_CLASS_NAME\}\}/gm, inputWrapperClassName)
    .replace(/\{\{INPUT_NAME\}\}/gm, payload.input.name)
    .replace(/\{\{INPUT_ATTRIBUTES\}\}/gm, inputAttrs)
    .replace(/\{\{MESSAGE\}}/gm, payload.message || '')
}

export function createCheckbox(payload: {
  label: string;
  message?: string;
  className?: string;
  attrs?: Record<string, string | number | boolean>;
  input: { name: string; } & Record<string, any>;
}) {
  const inputAttrs = generateAttributes({
    ...(payload?.input || {}),
    ...(payload?.input?.value ? { value: payload?.input?.value } : {}),
    ...(payload?.input?.disabled ? { disabled: '' } : {}),
    ...(payload?.input?.checked ? { checked: '' } : {}),
  })

  return checkboxElement
    .replace(/\{\{CLASS_NAME\}\}/gm, payload.className || '')
    .replace(/\{\{ATTRIBUTES\}\}/gm, generateAttributes(payload.attrs || {}))
    .replace(/\{\{INPUT_ATTRIBUTES\}\}/gm, inputAttrs)
    .replace(/\{\{LABEL\}\}/gm, payload.label)
    .replace(/\{\{NAME\}\}/gm, payload.input?.name)
    .replace(/\{\{MESSAGE\}}/gm, payload.message || '')
}

export function createButton(payload: {
  content: string;
  description?: string;
  className?: string;
  attrs?: Record<string, string | number | boolean>;
}) {
  return buttonElement
    .replace(/\{\{CLASS_NAME\}\}/gm, payload.className || '')
    .replace(/\{\{ATTRIBUTES\}\}/gm, generateAttributes(payload.attrs || {}))
    .replace(/\{\{CONTENT\}\}/gm, payload.content || '')
    .replace(/\{\{DESC\}\}/gm, payload.description || '')
}

export function createForm(params: {
  subscriberId: string;
}) {
  let newForm = form;

  for (const [key, inputOptions] of Object.entries(FORM_ITEMS)) {
    const options = {
      ...inputOptions,
      input: {
        ...inputOptions.input,
        ...(key === 'SUBSCRIBER_ID' && params?.subscriberId ? {
          value: params?.subscriberId,
          disabled: !!params?.subscriberId || undefined
        } : {})
      }
    }
    newForm = newForm.replace(
      new RegExp(`{{${key}}}`, 'gm'),
      key === 'AGREEMENT_CHECKBOX' ? createCheckbox(options) : createInput(options)
    );
  }
  
  const cardSubmit = createButton({
    content: 'Start {TRIAL_PERIOD} Trial',
    attrs: { type: 'submit' }
  })

  const providerButtons = ['paypal', 'googlePay', 'applePay'].map(provider => {
    return createButton({
      content: `<img src="https://zotlo-3platform-frontend.stage.mobylonia.com/editor/payment-providers/${provider}.png" alt="${provider}">`,
      className: 'provider '+provider,
      description: provider === 'paypal' ? 'The safer, easier way to pay' : undefined
    })
  }).join('');

  return newForm
    .replace(/\{\{CARD_SUBMIT\}\}/gm, cardSubmit)
    .replace(/\{\{TOTAL_PRICE\}\}/gm, '0.00USD')
    .replace(/\{\{PROVIDERS\}\}/gm, providerButtons)
}
