import paymentElement from '../html/payment.html'
import formElement from '../html/form.html'
import inputElement from '../html/input.html'
import checkboxElement from '../html/checkbox.html'
import buttonElement from '../html/button.html'
import tooltipElement from '../html/tooltip.html'
import selectElement from '../html/select.html'
import selectItemElement from '../html/select-item.html'
import noMethodElement from '../html/nomethod.html'
import { FORM_ITEMS } from './fields';
import { getCDNUrl } from '../utils/getCDNUrl'
import type { FormConfig } from './types'
import { PaymentProvider } from './types'
import Countries from '../countries.json'
import { getMaskByCode, template, generateAttributes } from '../utils'
import { useI18n } from '../utils/i18n'

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
}) {
  const { config, subscriberId, seperator, formType = 'both', className } = params;
  const attrs = generateAttributes({
    ...(params.attrs || {})
  });
  const { $t } = useI18n(config.general.localization);
  let newForm = template(formElement, { FORM_TYPE: formType, ATTRIBUTES: attrs, CLASS_NAME: className || '' });
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
        ? createCheckbox({
          ...options,
          label: $t(`form.${key}.label`, {
            distance: `<a href="#" target="_blank">${$t(`form.${key}.keyword.distance`)}</a>`,
            info: `<a href="#" target="_blank">${$t(`form.${key}.keyword.info`)}</a>`
          })
        })
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
}) {
  const { provider, config } = params;
  const { $t } = useI18n(config.general.localization);
  const canDarkMode = config.design.darkMode && [PaymentProvider.GOOGLE_PAY, PaymentProvider.APPLE_PAY].includes(provider);
  const postfix = canDarkMode ? '_black' : '';

  return createButton({
    content: `<img src="${getCDNUrl(`editor/payment-providers/${provider}${postfix}.png`)}" alt="${provider}">`,
    className: 'provider '+provider,
    description: provider === PaymentProvider.PAYPAL ? $t('paypalMotto') : undefined,
    attrs: { 'data-provider': provider },
    wrapperAttrs: { class: 'zotlo-checkout__payment-provider', 'data-tab-content': provider, 'data-tab-active': 'true' }
  })
}

export function createForm(params: {
  subscriberId: string;
  config: FormConfig;
}) {
  const { config } = params;
  const { $t } = useI18n(config.general.localization);
  const paymentMethodSetting = config.settings.paymentMethodSetting;
  const hasPaypal = paymentMethodSetting.some((item) => item.providerKey === PaymentProvider.PAYPAL);
  const hasOnlyPaypalButNotShown = hasPaypal && !config.general.showPaypal && paymentMethodSetting.length === 1;
  const privacyUrl = config.general.privacyUrl;
  const tosUrl = config.general.tosUrl;
  const isTabTheme = config.design.theme === 'horizontal';

  const paymentMethods = paymentMethodSetting.filter((item) => {
    if (item.providerKey === PaymentProvider.PAYPAL) return config.general.showPaypal;
    return true;
  });
  let providerButtons = paymentMethods.map((method, index) => {
    if (method.providerKey !== PaymentProvider.CREDIT_CARD) {
      return createProviderButton({
        provider: method.providerKey,
        config
      });
    }

    if (method.providerKey === PaymentProvider.CREDIT_CARD) {
      const isFirstItem = index === 0;
      const isLastItem = index === paymentMethods.length - 1;
      const isOnlyItem = paymentMethods.length === 1;
      const isMiddleItem = !isFirstItem && !isLastItem;
      let seperator = undefined as undefined | 'top' | 'bottom' | 'both';

      if (!isOnlyItem && !isFirstItem && isMiddleItem) {
        seperator = 'both';
      } else if (!isOnlyItem && isFirstItem) {
        seperator = 'bottom';
      } else if (!isOnlyItem && isLastItem) {
        seperator = 'top';
      }

      return createCreditCardForm({
        ...params,
        formType: isFirstItem ? 'both' : 'creditCard',
        seperator,
        className: 'zotlo-checkout__payment-provider',
        attrs: { 'data-tab-content': PaymentProvider.CREDIT_CARD, 'data-tab-active': 'true' }
      });
    }
  }).join('');

  if (paymentMethods?.[0]?.providerKey !== PaymentProvider.CREDIT_CARD || isTabTheme) {
    providerButtons = createCreditCardForm({
      ...params,
      formType: 'subscriberId',
      className: 'zotlo-checkout__payment-provider',
      attrs: {
        'data-tab-content': 'subscriberId',
        'data-tab-active': 'true'
      }
    }) + providerButtons;
  }

  const disclaimer = !config?.design?.footer || config?.design?.footer?.showMerchantDisclaimer
    ? $t('footer.disclaimer', {
      termsOfUse: `<a href="${tosUrl}">${$t('common.termsOfUse')}</a>`,
      privacyPolicy: `<a href="${privacyUrl}">${$t('common.privacyPolicy')}</a>`,
    })
    : '';

  const dir = ['he', 'ar'].includes(config.general.language) ? 'rtl' : 'ltr';

  if (hasOnlyPaypalButNotShown) {
    providerButtons = '';

    return template(noMethodElement, {
      DIR: dir,
      TITLE: $t('empty.noMethod.title'),
      DESC: $t('empty.noMethod.desc'),
    });
  }

  let tabButtons = '';

  if (isTabTheme) {
    const theme = {
      [PaymentProvider.CREDIT_CARD]: { dark: '.png', light: '_black.png' },
      [PaymentProvider.PAYPAL]: { dark: '_disabled.png', light: '.png' },
      [PaymentProvider.GOOGLE_PAY]: { dark: '.svg', light: '.svg' },
      [PaymentProvider.APPLE_PAY]: { dark: '.svg', light: '.svg' }
    }

    tabButtons = paymentMethods.reduce((acc, item, index) => {
      const postfix = theme[item.providerKey][config.design.darkMode ? 'dark' : 'light'];
      const imgSrc = getCDNUrl(`editor/payment-providers/${item.providerKey}${postfix}`);

      return acc + createButton({
        content: `<img src="${imgSrc}" alt="${item.providerKey}">${
          item.providerKey === PaymentProvider.CREDIT_CARD ? $t('common.card') : ''
        }`,
        className: 'zotlo-checkout__tab__button',
        attrs: {
          type: 'button',
          'data-active': index === 0 ? 'true' : 'false',
          'data-tab': item.providerKey,
          'aria-label': item.providerKey
        }
      });
    }, '');
  }

  return template(paymentElement, {
    DIR: dir,
    DARK_MODE: config.design.darkMode ? 'true' : 'false',
    THEME: config.design.theme,
    TAB_BUTTONS: tabButtons,
    PROVIDERS: providerButtons,
    // TODO: PRICE_INFO will be changed to a dynamic text by package
    PRICE_INFO: $t('footer.priceInfo.package_with_trial'),
    FOOTER_DESC: $t('footer.desc'),
    DISCLAIMER: disclaimer && `<div>${disclaimer}</div>`,
    ZOTLO_LEGALS_DESC: $t('footer.zotlo.legals.desc'),
    ZOTLO_LEGALS_LINKS: `<a href="${tosUrl}">${$t('common.termsOfService')}</a><a href="${privacyUrl}">${$t('common.privacyPolicy')}</a>`
  });
}
