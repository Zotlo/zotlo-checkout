import formElement from '../html/form.html'
import inputElement from '../html/input.html'
import checkboxElement from '../html/checkbox.html'
import buttonElement from '../html/button.html'
import tooltipElement from '../html/tooltip.html'
import selectElement from '../html/select.html'
import selectItemElement from '../html/select-item.html'
import Countries from '../countries.json'
import { generateAttributes, getMaskByCode, template, getCDNUrl, useI18n } from "../utils";
import { type FormConfig, PaymentProvider } from './types'
import { FORM_ITEMS } from './fields'

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
  const items = [];
  let selectOptions = '';

  function prepareItem(option: typeof payload['options'][0], text?: string) {
    const selectOption = `<option value="${option.value}" ${option.selected ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}>${option.label}</option>`

    const item = template(selectItemElement, {
      SELECTED: option.selected ? 'true' : 'false',
      TITLE: option.label,
      VALUE: option.value,
      ICON: option.icon ? `<img src="${option.icon}" role="graphic" />` : '',
      TEXT: text || option.label,
    });

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

  return template(selectElement, {
    ATTRIBUTES: attrs,
    CLASS_NAME: inputWrapperClassName,
    TOGGLE: (
      payload.showSelectedValue
        ? prepareItem(options[selectedIndex], options[selectedIndex].value).item
        : items[selectedIndex]
    ),
    NAME: payload.name,
    SELECT_ATTRIBUTES: selectAttrs,
    OPTIONS: selectOptions,
    LIST: items.join('')
  });
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
    disabled?: boolean;
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

  return template(inputElement, {
    TYPE: typeName,
    CLASS_NAME: payload.className || '',
    ATTRIBUTES: generateAttributes(payload.attrs || {}),
    LABEL: payload.label,
    INPUT_WRAPPER_CLASS_NAME: inputWrapperClassName,
    INPUT_NAME: payload.input.name,
    INPUT_ATTRIBUTES: inputAttrs,
    MESSAGE: payload.message || '',
    HINT: inputHint,
    TAG: tag
  }).replace(/data-left>/gm, `>${select}`);
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
  });

  return template(checkboxElement, {
    CLASS_NAME: payload.className || '',
    ATTRIBUTES: generateAttributes(payload.attrs || {}),
    INPUT_ATTRIBUTES: inputAttrs,
    LABEL: payload.label,
    NAME: payload.input?.name,
    MESSAGE: payload.message || ''
  });
}

export function createButton(payload: {
  content: string;
  description?: string;
  className?: string;
  attrs?: Record<string, string | number | boolean>;
  wrapperAttrs?: Record<string, string | number | boolean>;
}) {
  return template(buttonElement, {
    CLASS_NAME: payload.className || '',
    WRAPPER_ATTRIBUTES: generateAttributes(payload.wrapperAttrs || {}),
    ATTRIBUTES: generateAttributes(payload.attrs || {}),
    CONTENT: payload.content || '',
    DESC: payload.description || ''
  });
}

export function createCreditCardForm(params: {
  subscriberId: string
  config: FormConfig;
  formType?: 'creditCard' | 'subscriberId' | 'both';
  seperator?: 'top' | 'bottom' | 'both';
  className?: string;
  attrs?: Record<string, string | number | boolean>;
  showPrice: boolean;
}) {
  const { config, subscriberId, seperator, formType = 'both', className, showPrice } = params;
  const attrs = generateAttributes({
    ...(params.attrs || {})
  });
  const { $t } = useI18n(config.general.localization);
  let newForm = template(formElement, { FORM_TYPE: formType, ATTRIBUTES: attrs, CLASS_NAME: className || '', SHOW_PRICE: showPrice });
  let cardTop = '';
  let cardBottom = '';
  const seperatorText = `<div class="zotlo-checkout__seperator"><span>${$t('common.or')}</span></div>`;
  const isPhoneRegister = config.settings.registerType === 'phoneNumber';
  const isVerticalTheme = config.design.theme === 'vertical';

  for (const [key, inputOptions] of Object.entries(FORM_ITEMS)) {
    if (
      isPhoneRegister && key === 'SUBSCRIBER_ID_EMAIL' ||
      !isPhoneRegister && key === 'SUBSCRIBER_ID_PHONE'
    ) {
      newForm = template(newForm, { [key]: '' });
      continue;
    }

    const options = {
      ...inputOptions,
      label: $t(`form.${key}.label`),
      input: {
        ...inputOptions.input,
        ...(key.startsWith('SUBSCRIBER_ID') && subscriberId ? {
          value: subscriberId,
          disabled: (!config.settings.allowSubscriberIdEditing && !!subscriberId) || undefined
        } : {}),
        placeholder: $t(`form.${key}.placeholder`),
      }
    }

    newForm = template(newForm, {
      [key]: key === 'AGREEMENT_CHECKBOX'
        ? (
          config.general.isPolicyRequired ?
              createCheckbox({
              ...options,
              label: $t(`form.${key}.label`, {
                distance: `<a href="#" target="_blank">${$t(`form.${key}.keyword.distance`)}</a>`,
                info: `<a href="#" target="_blank">${$t(`form.${key}.keyword.info`)}</a>`
              })
            })
          : ''
        )
        : createInput(options)
    });
  }

  const cardSubmit = createButton({
    // TODO: This text will be changed to a dynamic text by package
    content: $t(`form.button.text.subscriptionActivationState.`+config.design.button.text.subscriptionActivationState),
    className: 'zotlo-checkout__cardSubmit',
    attrs: { type: 'submit', 'data-provider': PaymentProvider.CREDIT_CARD },
  });

  if (isVerticalTheme && (seperator === 'top' || seperator === 'both')) {
    cardTop = seperatorText + `<div class="zotlo-checkout__card-title">${$t('form.payWithCreditCard')}</div>`;
  }
  
  if (isVerticalTheme && (seperator === 'bottom' || seperator === 'both')) {
    cardBottom = seperatorText;
  }

  const totalPrice = config.paymentData?.selectedPrice.price || "0.00";
  const currency = config.paymentData?.selectedPrice.currency || config.general.currency || "USD";

  return template(newForm, {
    CARD_TOP: cardTop,
    CARD_BOTTOM: cardBottom,
    CARD_SUBMIT: cardSubmit,
    CDN_URL: getCDNUrl(''),
    TOTAL_LABEL: $t('form.total.label'),
    TOTAL_PRICE: `${totalPrice} ${currency}`
  })
}

export function createProviderButton(params: {
  provider: PaymentProvider;
  config: FormConfig;
  tabAvailable?: boolean;
}) {
  const { provider, config, tabAvailable } = params;
  const { $t } = useI18n(config.general.localization);
  const canDarkMode = config.design.darkMode && [PaymentProvider.GOOGLE_PAY, PaymentProvider.APPLE_PAY].includes(provider);
  const postfix = canDarkMode ? '_black' : '';

  return createButton({
    content: `<img src="${getCDNUrl(`editor/payment-providers/${provider}${postfix}.png`)}" alt="${provider}">`,
    className: 'provider '+provider,
    description: provider === PaymentProvider.PAYPAL ? $t('paypalMotto') : undefined,
    attrs: { 'data-provider': provider },
    wrapperAttrs: {
      class: 'zotlo-checkout__payment-provider',
      ...(tabAvailable ? { 'data-tab-content': provider, 'data-tab-active': 'true'} : {})
    }
  })
}
