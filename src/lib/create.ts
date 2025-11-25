import formElement from '../html/form.html?raw'
import inputElement from '../html/input.html?raw'
import checkboxElement from '../html/checkbox.html?raw'
import buttonElement from '../html/button.html?raw'
import tooltipElement from '../html/tooltip.html?raw'
import selectElement from '../html/select.html?raw'
import selectItemElement from '../html/select-item.html?raw'
import paymentSuccessElement from '../html/payment-success.html?raw'
import paymentDetailsElement from '../html/payment-details.html?raw'
import paymentHeaderElement from '../html/payment-header.html?raw'
import modalElement from '../html/modal.html?raw'
import creditCardFieldsElement from '../html/credit-card-fields.html?raw'
import savedCardItemElement from '../html/saved-card-item.html?raw'
import savedCardsFormElement from '../html/saved-cards-form.html?raw'
import Countries from '../countries.json'
import { generateAttributes, getMaskByCode, getCDNUrl, useI18n, getSubmitButtonContent } from "../utils";
import { getPackagePaymentAmountText } from '../utils/getPackageInfo';
import { template } from "../utils/template";
import { DesignTheme, type FormConfig, type FormSuccess, type PaymentDetail, PaymentProvider, SuccessTheme, SavedCardsGroupName, type SavedCreditCardData } from './types'
import { FORM_ITEMS } from './fields'
import { getCardInfoFromCardNumber } from '../utils/getCardMask';

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
  className?: string;
  attrs?: Record<string, string | number | boolean>;
  wrapperAttrs?: Record<string, string | number | boolean>;
}) {
  return template(buttonElement, {
    CLASS_NAME: payload.className || '',
    WRAPPER_ATTRIBUTES: generateAttributes(payload.wrapperAttrs || {}),
    ATTRIBUTES: generateAttributes(payload.attrs || {}),
    CONTENT: payload.content || '',
  });
}

export function createSavedCardItem(params: { config: FormConfig, card: SavedCreditCardData, groupName?: SavedCardsGroupName }) {
  const { card, config, groupName = SavedCardsGroupName.ON_PAYMENT_FORM } = params;
  const { $t } = useI18n(config.general.localization);
  const { cardNumber, cardIconImg } = getCardInfoFromCardNumber(card.creditCardNumber);
  const savedCardItem = template(savedCardItemElement, {
    RADIO_GROUP_NAME: groupName,
    CARD_ID: card.creditCardId,
    CARD_NUMBER_TEXT: cardNumber,
    CARD_EXPIRY_TEXT: $t('form.cards.expiresIn', { date: card.creditCardExpireDate }),
    CARD_LOGO: cardIconImg,
    EXPIRED_TEXT: $t('form.cards.expired'),
    IS_CARD_EXPIRED: card.creditCardExpired ? 1 : 0,
    RADIO_ATTRIBUTES: card.creditCardExpired ? 'disabled' : '',
  });
  return savedCardItem;
}

export function prepareCreditCardSection(params: { config: FormConfig }) {
  const { config } = params || {};
  const { $t } = useI18n(config.general.localization);

  if (import.meta.env.VITE_CONSOLE) return creditCardFieldsElement;

  const showSavedCards = config.general.showSavedCards;
  if (!showSavedCards) return creditCardFieldsElement;

  const savedCardList = config?.paymentData?.savedCardList || [];
  const isSavedCardAvailable = savedCardList.length > 0;
  if (!isSavedCardAvailable) return creditCardFieldsElement;

  const firstUseableCard = savedCardList.find(card => !card.creditCardExpired);
  if (!firstUseableCard) return creditCardFieldsElement;

  const savedCardItem = createSavedCardItem({ config, card: firstUseableCard });

  return template(savedCardsFormElement, {
    SAVED_CARDS: savedCardItem,
    RADIO_GROUP_NAME: SavedCardsGroupName.ON_PAYMENT_FORM,
    ALL_CARDS_TEXT: $t('form.cards.allCards'),
    USE_NEW_CARD_TEXT: $t('form.cards.useNewCard'),
    CARD_FIELDS: creditCardFieldsElement,
  });
}

export function createCreditCardForm(params: {
  config: FormConfig;
  formType?: 'creditCard' | 'subscriberId' | 'both';
  seperator?: 'top' | 'bottom' | 'both';
  className?: string;
  attrs?: Record<string, string | number | boolean>;
  showPrice: boolean;
}) {
  const { config, seperator, formType = 'both', className, showPrice } = params;
  const subscriberId = config.settings.registerType === 'other' ? '' : (config.general.subscriberId || '');
  const attrs = generateAttributes({
    ...(params.attrs || {}),
    ...({ 'data-form-type': formType })
  });
  const { $t } = useI18n(config.general.localization);


  let newForm = template(formElement, { 
    FORM_TYPE: formType, 
    ATTRIBUTES: attrs, 
    CLASS_NAME: className || '', 
    SHOW_PRICE: showPrice,
    CREDIT_CARD_SECTION: prepareCreditCardSection({ config }),
  });

  let cardTop = '';
  let cardBottom = '';
  const seperatorText = `<div class="zotlo-checkout__seperator"><span>${$t('common.or')}</span></div>`;
  const registerType = config.settings.registerType === 'other' ? 'email' : config.settings.registerType;
  const isPhoneRegister = registerType === 'phoneNumber';
  const isZipcodeRequired = config.general.isZipcodeRequired;
  const isVerticalTheme = config.design.theme === DesignTheme.VERTICAL;

  for (const [key, inputOptions] of Object.entries(FORM_ITEMS)) {
    if (config.settings.hideSubscriberIdIfAlreadySet) {
      if (key.startsWith('SUBSCRIBER_ID') && subscriberId) {
        newForm = template(newForm, { [key]: '' });
        continue; // Skip if subscriber ID is already set and the field is hidden
      }
    }

    if (
      isPhoneRegister && key === 'SUBSCRIBER_ID_EMAIL' ||
      !isPhoneRegister && key === 'SUBSCRIBER_ID_PHONE' ||
      !isZipcodeRequired && key === 'ZIP_CODE'
    ) {
      newForm = template(newForm, { [key]: '' });
      continue;
    }

    const options = {
      ...inputOptions,
      defaultCountryCode: config.general.countryCode,
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

    let fieldContent = '';
    
    switch (key) {
      case "AGREEMENT_CHECKBOX":
        fieldContent = config.general.isPolicyRequired
          ? createCheckbox({
              ...options,
              label: $t(`form.${key}.label`, {
                distance: `<a href="javascript:;" data-agreement="distanceSalesAgreement">${$t(`form.${key}.keyword.distance`)}</a>`,
                info: `<a href="javascript:;" data-agreement="informationForm">${$t(`form.${key}.keyword.info`)}</a>`
              })
            })
          : '';
        break;
      case "SAVE_CARD_CHECKBOX":
        fieldContent = config.general.showSavedCards ? createCheckbox(options) : '';
        break;
      default:
        fieldContent = createInput(options);
        break;
    }

    newForm = template(newForm, {
      [key]: fieldContent
    });
  }

  const buttonContent = getSubmitButtonContent(config);

  const cardSubmit = createButton({
    content: buttonContent,
    className: 'zotlo-checkout__cardSubmit',
    attrs: { type: 'submit', 'data-provider': PaymentProvider.CREDIT_CARD, 'data-card-submit-button': '' },
  });

  if (isVerticalTheme && (seperator === 'top' || seperator === 'both')) {
    cardTop = seperatorText + `<div class="zotlo-checkout__card-title">${$t('form.payWithCreditCard')}</div>`;
  }
  
  if (isVerticalTheme && (seperator === 'bottom' || seperator === 'both')) {
    cardBottom = seperatorText;
  }

  const totalPrice = config.packageInfo?.totalPayableAmount || '0.00 USD';

  return template(newForm, {
    CARD_TOP: cardTop,
    CARD_BOTTOM: cardBottom,
    CARD_SUBMIT: cardSubmit,
    CDN_URL: getCDNUrl(''),
    TOTAL_LABEL: $t('form.total.label'),
    TOTAL_PRICE: `${totalPrice}`
  })
}

export function createProviderButton(params: {
  provider: PaymentProvider;
  config: FormConfig;
  tabAvailable?: boolean;
}) {
  const { provider, config, tabAvailable } = params;
  const canDarkMode = config.design.darkMode && [PaymentProvider.GOOGLE_PAY, PaymentProvider.APPLE_PAY].includes(provider);
  const postfix = canDarkMode ? '_black' : '';
  const buttonsRenderedBySdks = [
    PaymentProvider.GOOGLE_PAY,
    ...(!!config.paymentData?.useNewPayPal ? [PaymentProvider.PAYPAL] : [])
  ];

  if (import.meta.env.VITE_SDK_API_URL && buttonsRenderedBySdks.includes(provider)) {
    return `<div id="${provider}-button" class="zotlo-checkout__payment-provider zotlo-checkout__payment-provider-button-wrapper" ${tabAvailable ? `data-tab-content="${provider}" data-tab-active="true"` : ''}></div>`;
  }

  return createButton({
    content: `<img src="${getCDNUrl(`editor/payment-providers/${provider}${postfix}.png`)}" alt="${provider}">`,
    className: 'provider '+provider,
    attrs: { 'data-provider': provider },
    wrapperAttrs: {
      class: 'zotlo-checkout__payment-provider',
      ...(tabAvailable ? { 'data-tab-content': provider, 'data-tab-active': 'true'} : {})
    }
  })
}

export function prepareButtonSuccessLink(params: {
  config: FormConfig;
  paymentDetail: PaymentDetail;
}) {
  const { config, paymentDetail } = params;
  const theme = config.success.theme;
  const os = paymentDetail?.client?.selectedOs || '';

  if (theme === SuccessTheme.APP2WEB) {
    const iosLink = paymentDetail?.application.links.deeplinkIos || '';

    switch (os) {
      case 'android':
        return paymentDetail?.application.links.deeplinkAndroid || '';
      case 'desktop':
        return paymentDetail?.application.links.deeplinkWeb || '';
      case 'ios':
        return iosLink;
      default:
        return iosLink;
    }
  } else {
    if (config.success?.genericButton?.show) {
      return paymentDetail.application.links.genericDownloadUrl || '';
    }

    switch (os) {
      case 'android':
        return paymentDetail?.application.links.googlePlayStoreUrl || '';
      case 'ios':
        return paymentDetail?.application.links.appStoreUrl || '';
      default:
        return paymentDetail?.application.links.genericDownloadUrl || '';
    }
  }
}

export function preparePaymentDetailsSection(params: {
  config: FormConfig;
  paymentDetail: PaymentDetail;
}) {
  const { config, paymentDetail } = params;
  const { $t } = useI18n(config.general.localization);
  const productName = paymentDetail?.application?.name || '-';
  const { 
    purchase_date:purchaseDate = '-', 
    expire_date:expireDate = '-', 
    provider_key_translation:paymentMethod = '-' 
  } = paymentDetail?.transaction?.[0] || {};
  const paymentAmountText = import.meta.env.VITE_CONSOLE ? '-' : getPackagePaymentAmountText(config);
  const isOneTimePayment = config.packageInfo?.condition === 'onetime_payment';
  const customerSupportUrl = paymentDetail?.application?.links?.customerSupportUrl || '';
  const zotloAccountUrl = "https://account.zotlo.com/";

  const paymentDetailsFooterElement = template($t('paymentSuccess.paymentDetails.footer'), {
    CUSTOMER_SUPPORT_LINK: `<a href="${customerSupportUrl}" target="_blank">${$t('common.customerService')}</a>`,
    ACCOUNT_LINK: `<a href="${zotloAccountUrl}" target="_blank">${$t('common.here')}</a>`
  });

  return template(paymentDetailsElement, {
    TITLE: $t('paymentSuccess.paymentDetails.title'),
    PRODUCT_TITLE: $t('common.product'),
    PRODUCT_TEXT: productName,
    DATE_TITLE: isOneTimePayment ? $t('common.paidOn') : $t('common.expiresOn'),
    DATE_TEXT: isOneTimePayment ? purchaseDate : expireDate,
    PAYMENT_METHOD_TITLE: $t('common.paymentMethod'),
    PAYMENT_METHOD_TEXT: paymentMethod,
    PAYMENT_AMOUNT_TITLE: $t('common.paymentAmount'),
    PAYMENT_AMOUNT_TEXT: paymentAmountText,
    FOOTER: paymentDetailsFooterElement
  });
}

export function createPaymentSuccessForm(params: {
  containerId: string;
  config: FormConfig;
  paymentDetail: PaymentDetail;
}) {
  if (!params.config?.success?.show) return false;
  
  const { containerId, config, paymentDetail } = params;
  const MAX_WAIT_TIME = 50; // Maximum wait time in seconds
  const MIN_WAIT_TIME = 5; // Minimum wait time in seconds
  const WAIT_TIME = config.success.waitTime; // in seconds
  const delay = WAIT_TIME > MAX_WAIT_TIME ? MAX_WAIT_TIME : (WAIT_TIME < MIN_WAIT_TIME ? MIN_WAIT_TIME : WAIT_TIME);
  const successTheme = config.success.theme;
  const container = document.getElementById(containerId);
  const form = container?.querySelector('.zotlo-checkout') as HTMLDivElement;
  const { $t } = useI18n(config.general.localization);
  const buttonText = successTheme === SuccessTheme.APP2WEB
    ? (config?.success?.button?.text || 0)
    : (config.success?.genericButton?.text || 0);
  const redirectUrl = prepareButtonSuccessLink({ config, paymentDetail }) || '';
  const canAutoRedirect = successTheme === SuccessTheme.APP2WEB && !!redirectUrl && config.success.autoRedirect;
  const storeUrls = {
    apple: paymentDetail?.application?.links?.appStoreUrl,
    google: paymentDetail?.application?.links?.googlePlayStoreUrl,
    amazon: paymentDetail?.application?.links?.amazonStoreUrl,
    microsoft: paymentDetail?.application?.links?.microsoftStoreUrl,
    huawei: paymentDetail?.application?.links?.huaweiAppGalleryUrl,
  }

  const storeButtons = successTheme === SuccessTheme.WEB2APP
    ? Object.entries(storeUrls)
      .map(([store, link]) => {
        const canVisible = !!config?.success?.storeButtons?.[store as keyof FormSuccess['storeButtons']] && !!link;
        if (!canVisible) return '';
        const img = getCDNUrl(`editor/store-badges/${store}${config.design.darkMode ? '' : '_dark' }.png`);
        return `<a href="${link}" target="_blank" class="zotlo-checkout__store-button ${store}"><img src="${img}" alt="Store - ${store}"></a>`;
      }).join('')
    : '';

  const paymentDetailsSection = preparePaymentDetailsSection({ config, paymentDetail });

  const htmlText = template(paymentSuccessElement, {
    THEME: successTheme,
    TITLE: $t('paymentSuccess.title'),
    BUTTON_TEXT: typeof buttonText === 'number'
      ? $t(`paymentSuccess.button.${successTheme}.${buttonText}`)
      : buttonText,
    BUTTON_LINK: redirectUrl || '#',
    TIMER_TEXT: $t('paymentSuccess.timer', { second: delay }),
    AUTO_REDIRECT: canAutoRedirect,
    STORE_BUTTONS: storeButtons,
    WEB2APP_DESC: $t('paymentSuccess.desc2'),
    SHOW_BUTTON: successTheme === SuccessTheme.APP2WEB || (successTheme === SuccessTheme.WEB2APP && config.success?.genericButton?.show),
    PAYMENT_DETAILS: paymentDetailsSection,
  });

  function startTimer(timeInSeconds: number) {
    let seconds = timeInSeconds;
    const timer = setInterval(() => {
      seconds--;
      const successMessage = form.querySelector('[data-timer]') as HTMLDivElement;
      if (successMessage) {
        successMessage.innerHTML = $t('paymentSuccess.timer', { second: seconds })
      }
      if (seconds <= 0) {
        clearInterval(timer);
        window.location.href = redirectUrl; // Redirect to the game or desired URL
      }
    }, 1000);
  }

  if (container) {
    const itemsExceptHeader = form.querySelectorAll(':scope > div:not(.zotlo-checkout__header)');
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    for (const item of itemsExceptHeader) {
      (item as HTMLDivElement).style.display = 'none';
    }
    
    form?.appendChild(doc.body.firstChild as HTMLElement);

    // Remove close button
    form.querySelector('[data-close]')?.remove();

    if (canAutoRedirect) {
      if (import.meta.env.VITE_SDK_API_URL) {
        startTimer(delay);
      }
    }
  }
}

export function createAgreementModal(params: {
  key: 'distanceSalesAgreement' | 'informationForm';
  config: FormConfig;
}) {
  const { key, config } = params;
  const { $t } = useI18n(config.general.localization);

  const bodyContent = `<iframe src="${config.general.documents[key]}" frameborder="0" width="100%" height="100%"></iframe>`;

  return template(modalElement, {
    MODAL_NAME: 'agreement',
    TITLE: $t(`agreement.title.${key}`),
    BODY_CONTENT: bodyContent,
    SHOW_CLOSE_BUTTON: true,
  })
}

export function createAllCardsModal(params: {
  config: FormConfig;
}) {
  const { config } = params;
  const { $t } = useI18n(config.general.localization);
  const zotloAccountUrl = "https://account.zotlo.com/account";
  const savedCardList = config?.paymentData?.savedCardList || [];
  let savedCardsHtml = '';
  savedCardList.forEach(card => {
    const savedCardItem = createSavedCardItem({ config, card, groupName: SavedCardsGroupName.ON_ALL_CARDS_MODAL });
    savedCardsHtml += savedCardItem;
  });

  const titleIcon = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.3747 16.9167C17.8914 16.9167 17.4997 17.3085 17.4997 17.7917C17.4997 18.275 17.8914 18.6667 18.3747 18.6667H21.2913C21.7746 18.6667 22.1663 18.275 22.1663 17.7917C22.1663 17.3085 21.7746 16.9167 21.2913 16.9167H18.3747ZM2.33301 9.62504C2.33301 7.53096 4.03059 5.83337 6.12467 5.83337H21.8747C23.9688 5.83337 25.6663 7.53096 25.6663 9.62504V18.375C25.6663 20.4691 23.9688 22.1667 21.8747 22.1667H6.12467C4.03059 22.1667 2.33301 20.4691 2.33301 18.375V9.62504ZM23.9163 11.0834V9.62504C23.9163 8.49746 23.0023 7.58337 21.8747 7.58337H6.12467C4.99709 7.58337 4.08301 8.49746 4.08301 9.62504V11.0834H23.9163ZM4.08301 12.8334V18.375C4.08301 19.5026 4.99709 20.4167 6.12467 20.4167H21.8747C23.0023 20.4167 23.9163 19.5026 23.9163 18.375V12.8334H4.08301Z" fill="currentColor"/>
  </svg>`;

  const footerContent = `
    <div class="zotlo-checkout__modal--all-cards-footer-holder">
      <a href="${zotloAccountUrl}" target="_blank">${$t('form.cards.manageCreditCards')}</a>
      <div class="zotlo-checkout__button-container">
        <button class="zotlo-checkout__button zotlo-checkout__button--secondary" data-all-cards-cancel-button>${$t('common.cancel')}</button>
        <button class="zotlo-checkout__button" data-all-cards-select-button>${$t('common.continue')}</button>
      </div>
    </div>
  `;

  return template(modalElement, {
    MODAL_NAME: 'all-cards',
    TITLE_ICON: titleIcon,
    TITLE: $t('form.cards.myCards'),
    BODY_CONTENT: savedCardsHtml,
    SHOW_CLOSE_BUTTON: false,
    FOOTER_CONTENT: footerContent,
  })
}

export function createPaymentHeader(params: {
  config: FormConfig;
}) {
  const { config } = params;
  const { $t } = useI18n(config.general.localization);
  const showHeader = Object.prototype.hasOwnProperty.call(config.design, 'header') ? !!config.design.header?.show : true;
  const closeButtonUrl = config.design.header?.close?.url;

  return template(paymentHeaderElement, {
    LOGO: config.general.appLogo || '',
    APP_NAME: config.general.appName || '',
    SHOW_HEADER: showHeader && (!!config.general.appName || !!config.general.appLogo),
    SHOW_CLOSE_BUTTON: !!config.design.header?.close?.show && !!closeButtonUrl,
    CLOSE_BUTTON_URL: closeButtonUrl,
    CLOSE_BUTTON_TEXT: $t('common.close'),
  })
}
