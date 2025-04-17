import form from '../html/form.html'
import inputElement from '../html/input.html'
import checkboxElement from '../html/checkbox.html'
import buttonElement from '../html/button.html'
import tooltipElement from '../html/tooltip.html'
import selectElement from '../html/select.html'
import selectItemElement from '../html/select-item.html'
import { FORM_ITEMS } from './fields';
import { getCDNUrl } from '../utils/getCDNUrl'
import type { FormConfig } from './types'
import Countries from '../countries.json'
import { getMaskByCode } from '../utils'

function generateAttributes(attrs: Record<string, string | number | boolean>) {
  if (!attrs) return '';
  return Object.entries(attrs).map(([key, value]) => value !== undefined && value !== null ? `${key}="${value}"` : '').join(' ')
}

export function createSelect(payload: {
  name: string;
  attrs?: Record<string, string | number | boolean>;
  selectAttrs?: Record<string, string | number | boolean>;
  showSelectedValue?: boolean;
  options: {
    label: string;
    value: string;
    selected?: boolean;
    disabled?: boolean;
    icon?: string;
  }[]
}) {
  const { options } = payload;
  const attrs = generateAttributes({
    ...(payload.attrs || {})
  });
  const selectAttrs = generateAttributes({
    ...(payload.selectAttrs || {}),
    ...(payload.attrs?.disabled ? { disabled: '' } : {})
  });

  let selectedIndex = -1;
  let items = [];
  let selectOptions = '';

  function prepareItem(option: typeof payload['options'][0], text?: string) {
    const selectOption = `<option value="${option.value}" ${option.selected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}>${option.label}</option>`

    const item = selectItemElement
      .replace(/\{\{SELECTED\}\}/gm, option.selected ? 'true' : 'false')
      .replace(/\{\{TITLE\}\}/gm, option.label)
      .replace(/\{\{VALUE\}\}/gm, option.value)
      .replace(/\{\{ICON\}\}/gm, option.icon ? `<img src="${option.icon}" role="graphic" />` : '')
      .replace(/\{\{TEXT\}\}/gm, text || option.label)
    return {
      item,
      selectOption
    }
  }

  for (let index = 0; index < options.length; index++) {
    const item = options[index];
    if (item.selected) selectedIndex = index;

    const { selectOption: optionItem, item: listItem } = prepareItem(item);

    selectOptions += optionItem
    items.push(listItem);
  }

  const inputWrapperClassName = payload?.attrs?.disabled ? 'disabled' : '';

  return selectElement
    .replace(/\{\{ATTRIBUTES\}\}/gm, attrs)
    .replace(/\{\{CLASS_NAME\}\}/gm, inputWrapperClassName)
    .replace(/\{\{TOGGLE\}\}/gm, payload.showSelectedValue
      ? prepareItem(options[selectedIndex], options[selectedIndex].value).item
      : items[selectedIndex]
    )
    .replace(/\{\{NAME\}\}/gm, payload.name)
    .replace(/\{\{SELECT_ATTRIBUTES\}\}/gm, selectAttrs)
    .replace(/\{\{OPTIONS\}\}/gm, selectOptions)
    .replace(/\{\{LIST\}\}/gm, items.join(''));
}

export function createInput(payload: {
  label: string;
  message?: string;
  hint?: string;
  className?: string;
  attrs?: Record<string, string | number | boolean>;
  defaultCountryCode?: string;
  input: {
    name: string;
    type?: string;
    value?: string;
    placeholder?: string;
  } & Record<string, any>;
}) {

  let select = '';
  let tag = 'label';
  
  const defaultCountry = Countries.find((item, index) => {
    if (payload.defaultCountryCode) {
      return item.iso === payload.defaultCountryCode;
    }
    return index === 0
  });

  const inputAttrs = generateAttributes({
    ...(payload.input || {}),
    ...(payload?.input?.disabled ? { disabled: '' } : {}),
    ...(payload?.input?.type === 'phone' ? {
      'data-phone': '',
      'data-mask': getMaskByCode(defaultCountry),
    } : {}),
  });

  const inputWrapperClassName = payload?.input?.disabled ? 'disabled' : '';

  const inputHint = payload?.hint
    ? `<span class="zotlo-checkout__hint__toggle"><img src="${getCDNUrl('cards/info.svg')}" alt="Info" class="size-16"></span>` + tooltipElement.replace(/\{\{CONTENT\}}/gm, payload.hint)
    : ''

  const typeName = (payload?.input?.type === 'phone' ? 'text' : payload?.input?.type) || 'text';

  if (payload?.input?.type === 'phone') {
    tag = 'div';

    select = createSelect({
      name: payload.input.name+ '_countrySelect',
      showSelectedValue: true,
      attrs: {
        disabled: !!payload?.input?.disabled
      },
      options: Countries.map((item) => ({
        label: item.name,
        value: item.iso,
        selected: defaultCountry?.iso === item.iso,
        icon: getCDNUrl(`flags/${item.iso}.svg`)
      }))
    });
  };

  return inputElement
    .replace(/\{\{TYPE\}\}/gm, typeName)
    .replace(/\{\{CLASS_NAME\}\}/gm, payload.className || '')
    .replace(/\{\{ATTRIBUTES\}\}/gm, generateAttributes(payload.attrs || {}))
    .replace(/\{\{LABEL\}\}/gm, payload.label)
    .replace(/\{\{INPUT_WRAPPER_CLASS_NAME\}\}/gm, inputWrapperClassName)
    .replace(/\{\{INPUT_NAME\}\}/gm, payload.input.name)
    .replace(/\{\{INPUT_ATTRIBUTES\}\}/gm, inputAttrs)
    .replace(/\{\{MESSAGE\}}/gm, payload.message || '')
    .replace(/\{\{HINT\}}/gm, inputHint)
    .replace(/data\-left\>/gm, `>${select}`)
    .replace(/\{\{TAG\}}/gm, tag);
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
  config: FormConfig;
}) {
  const { subscriberId, config } = params;
  let newForm = form;
  const isPhoneRegister = config.settings.registration === 'phoneNumber';

  for (const [key, inputOptions] of Object.entries(FORM_ITEMS)) {
    if (
      isPhoneRegister && key === 'SUBSCRIBER_ID_EMAIL' ||
      !isPhoneRegister && key === 'SUBSCRIBER_ID_PHONE'
    ) {
      newForm = newForm.replace(new RegExp(`{{${key}}}`, 'gm'), '');
      continue;
    }

    const options = {
      ...inputOptions,
      input: {
        ...inputOptions.input,
        ...(key.startsWith('SUBSCRIBER_ID') && subscriberId ? {
          value: subscriberId,
          disabled: (!config.settings.allowSubscriberIdEditing && !!subscriberId) || undefined
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
    className: 'zotlo-checkout__cardSubmit',
    attrs: { type: 'submit' }
  })

  const providerButtons = ['paypal', 'googlePay', 'applePay'].map(provider => {
    const canDarkMode = config.design.darkMode && ['googlePay', 'applePay'].includes(provider)
    const postfix = canDarkMode ? '_black' : '';

    return createButton({
      content: `<img src="${getCDNUrl(`editor/payment-providers/${provider}${postfix}.png`)}" alt="${provider}">`,
      className: 'provider '+provider,
      description: provider === 'paypal' ? 'The safer, easier way to pay' : undefined,
    })
  }).join('');

  const disclaimer = !config?.design?.footer || config?.design?.footer?.showMerchantDisclaimer
    ? `<div>By proceeding, you confirm that you acknowledge and accept <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a> of the service.</div>`
    : '';

  return newForm
    .replace(/\{\{CARD_SUBMIT\}\}/gm, cardSubmit)
    .replace(/\{\{TOTAL_PRICE\}\}/gm, '0.00 USD')
    .replace(/\{\{PROVIDERS\}\}/gm, providerButtons)
    .replace(/\{\{DISCLAIMER\}\}/gm, disclaimer)
    .replace(/\{\{CDN_URL\}\}/gm, getCDNUrl(''))
}
