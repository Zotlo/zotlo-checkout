import form from '../html/form.html'
import inputElement from '../html/input.html'
import checkboxElement from '../html/checkbox.html'
import buttonElement from '../html/button.html'
import tooltipElement from '../html/tooltip.html'
import { FORM_ITEMS } from './fields';
import { getCDNUrl } from '../utils/getCDNUrl'

function generateAttributes(attrs: Record<string, string | number | boolean>) {
  if (!attrs) return '';
  return Object.entries(attrs).map(([key, value]) => value !== undefined && value !== null ? `${key}="${value}"` : '').join(' ')
}

export function createInput(payload: {
  label: string;
  message?: string;
  hint?: string;
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

  const inputHint = payload?.hint
    ? `<span class="zotlo-checkout__hint__toggle"><img src="${getCDNUrl('cards/info.svg')}" alt="Info" class="size-16"></span>` + tooltipElement.replace(/\{\{CONTENT\}}/gm, payload.hint)
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
    .replace(/\{\{HINT\}}/gm, inputHint)
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
      content: `<img src="${getCDNUrl(`editor/payment-providers/${provider}.png`)}" alt="${provider}">`,
      className: 'provider '+provider,
      description: provider === 'paypal' ? 'The safer, easier way to pay' : undefined
    })
  }).join('');

  return newForm
    .replace(/\{\{CARD_SUBMIT\}\}/gm, cardSubmit)
    .replace(/\{\{TOTAL_PRICE\}\}/gm, '0.00USD')
    .replace(/\{\{PROVIDERS\}\}/gm, providerButtons)
}
