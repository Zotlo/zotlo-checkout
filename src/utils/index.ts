import Countries from '../countries.json';
import { DesignTheme, type FormConfig, type IZotloCardParams, type IZotloCheckoutParams, PaymentProvider, PaymentResultStatus, SavedCardsGroupName } from '../lib/types';
import { createAllCardsModal, createSavedCardItem } from '../lib/create';
import { getPackageTemplateParams } from './getPackageInfo';
import { useI18n } from './i18n';
import { template } from "./template";
import { deleteSession } from './session';
import { FORM_ITEMS } from '../lib/fields';

export { getCDNUrl } from './getCDNUrl';
export { useI18n } from './i18n';

type Country = typeof Countries[0];

export const ZOTLO_GLOBAL = {
  cardUpdate: false,
  checkout: {
    containerId: '',
  },
  card: {
    containerId: '',
  },

  get containerId() {
    return this.cardUpdate ? this.card.containerId : this.checkout.containerId;
  },

  set containerId(value: string) {
    if (this.cardUpdate) {
      this.card.containerId = value;
      return;
    }
    this.checkout.containerId = value;
  },

  get container() {
    return document.getElementById(this.containerId);
  },

  get formElement() {
    if (!this.container) return null;
    return this.container?.querySelector('form.zotlo-checkout') as HTMLFormElement
  }
}

export function shouldSkipBillingFields(config: FormConfig) {
  const toggleName = FORM_ITEMS.BILLING_ACTIVATE.input.name;
  const parentSelector = config.design.theme !== DesignTheme.MOBILEAPP ? '[data-tab-active="true"] ' : '';
  const billingToggleCheckbox = ZOTLO_GLOBAL?.formElement?.querySelector(`${parentSelector} input[name="${toggleName}"]`) as HTMLInputElement;
  const skipBillingFields = !!billingToggleCheckbox && !billingToggleCheckbox?.checked;

  return skipBillingFields;
}

export function getCountryCodeByNumber(phoneNumber: string | number, matchLength = true): string {
  const clearPattern = /[\s-()+]/g
  const cleanPhoneNumber = `${phoneNumber}`.replace(clearPattern, '');
  const country = Countries.find((item) => {
    const code = item.code.replace(/\D/g, '');
    const mask = (Array.isArray(item.mask) ? item.mask[0] : item.mask).replace(clearPattern, '');
    const fullMask = `${code}${mask}`;
    const isMatchingLength = matchLength ? fullMask.length === cleanPhoneNumber.length : true;
    const codeByItem = cleanPhoneNumber.substring(0, code.length);
    return isMatchingLength && code === codeByItem;
  });

  return country?.iso ?? '';
}

export function getCountryByCode(code: string): (Country & { maskLength: number }) | undefined {
  const item = Countries.find((country: any) => country.iso === code);
  if (!item) return;
  const mask = (item.code + (Array.isArray(item.mask) ? item.mask[0] : item.mask)).replace(/[\s-()+]/g, '');

  return {
    ...item,
    maskLength: mask.length
  };
}

export function getMaskByCode(country: any) {
  let mask = country.code + ' ';
  if (Array.isArray(country.mask)) {
    mask += country.mask[0];
  } else {
    mask += country.mask;
  }
  return mask;
}

export function generateAttributes(attrs: Record<string, string | number | boolean>) {
  if (!attrs) return '';
  return Object.entries(attrs).map(([key, value]) => value !== undefined && value !== null ? `${key}="${value}"` : '').join(' ')
}

export function preparePaymentMethods(config: FormConfig) {
  return config?.settings?.paymentMethodSetting?.filter((item) => {
    const isAvailable = import.meta.env.VITE_CONSOLE ? true : !!config?.paymentData?.providers?.[item?.providerKey];
    const isApplePayCanMakePayments = import.meta.env.VITE_CONSOLE ? true : config?.providerConfigs?.applePay?.canMakePayments;
    const isGooglePayReadyToPay = import.meta.env.VITE_CONSOLE ? true : config?.providerConfigs?.googlePay?.isReadyToPay;
    if (item.providerKey === PaymentProvider.APPLE_PAY) return isApplePayCanMakePayments && isAvailable;
    if (item.providerKey === PaymentProvider.GOOGLE_PAY) return isGooglePayReadyToPay && isAvailable;
    if (item.providerKey === PaymentProvider.PAYPAL) return config.general.showPaypal;
    return isAvailable;
  }) || [];
}

function disableTabKeyNavigation(formEl: HTMLFormElement, disable:boolean = true) {
  const formElements = formEl.querySelectorAll('input, select, textarea, button, a');
  formElements.forEach(element => {
    if (disable) {
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('tabindex');
    }
  });
}

export function setFormLoading(loading: boolean = true) {
  const formElement = ZOTLO_GLOBAL.formElement;

  if (!formElement) return;
  let loaderEl = formElement.querySelector('.zotlo-checkout__loader') as HTMLDivElement;
  if (loading) {
    if (!loaderEl) {
      loaderEl = document.createElement('div');
      loaderEl.className = 'zotlo-checkout__loader';
      formElement.insertBefore(loaderEl, formElement.firstChild);
    }
    disableTabKeyNavigation(formElement);
    formElement.style.pointerEvents = 'none';
    formElement.style.userSelect = 'none';
    formElement.setAttribute('data-loading', 'true');
  } else {
    disableTabKeyNavigation(formElement, false);
    loaderEl?.remove();
    formElement.removeAttribute('data-loading');
    formElement.style.pointerEvents = '';
    formElement.style.userSelect = '';
  }
}

export function isPlainObject(item: unknown) {
  return (!!item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target: Record<string, any>, ...sources: Record<string, any>[]) {
  if (!sources.length) return { ...target };
  const source = sources.shift();
  const result = { ...target };

  if (isPlainObject(result) && isPlainObject(source)) {
    for (const key in source) {
      if (isPlainObject(source[key])) {
        result[key] = mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return mergeDeep(result, ...sources);
}

export const debounce: any = (func: any, waitFor = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), waitFor);
  };
}

export function setFormDisabled(disabled = true) {
  const formElement = ZOTLO_GLOBAL.formElement;
  const inputs = formElement?.querySelectorAll('input, select, button') as NodeListOf<HTMLInputElement>;
  const wrappers = formElement?.querySelectorAll('.zotlo-checkout__input, .zotlo-checkout__checkbox, .zotlo-checkout__payment-provider') as NodeListOf<HTMLElement>;
  for (const wrapper of wrappers) {
    if (disabled) {
    wrapper.classList.add('disabled');
    } else {
    wrapper.classList.remove('disabled');
    }
  }
  for (const input of inputs) {
    if (disabled) {
      input.setAttribute('disabled', 'true');
    } else {
      input.removeAttribute('disabled');
    }
  }
}

export function activateDisabledSubscriberIdInputs() {
  const subscriberIdInputs = ZOTLO_GLOBAL.formElement?.querySelectorAll('input[name="subscriberId"]') as NodeListOf<HTMLInputElement>;
  subscriberIdInputs?.forEach(input => {
    input?.removeAttribute('disabled');
    const wrapper = input?.closest('.zotlo-checkout__input');
    if (wrapper) wrapper.classList.remove('disabled');
  });
}

export function handleSubscriberIdInputEventListeners(action: 'add' | 'remove' = 'add', triggerFunction: () => void) {
  const subscriberIdInputs = ZOTLO_GLOBAL.formElement?.querySelectorAll('input[name="subscriberId"]') as NodeListOf<HTMLInputElement>;
  subscriberIdInputs?.forEach(input => {
    if (action === 'add') {
      input.addEventListener('input', triggerFunction);
    } else {
      input.removeEventListener('input', triggerFunction);
    }
  });
}

function selectSavedCard(params: { cardId: number, groupName?: SavedCardsGroupName }) {
  const { cardId, groupName = SavedCardsGroupName.ON_PAYMENT_FORM } = params;
  if (!cardId) return;
  const cardInput = ZOTLO_GLOBAL.formElement?.querySelector<HTMLInputElement>(`input[type="radio"][name="${groupName}"][value="${cardId}"]`);
  if (cardInput) cardInput.checked = true;
}

export function handleSavedCardsEvents(params: { config: FormConfig }) {
  const { config } = params;
  // Select first radio input for saved cards by default
  const formElement = ZOTLO_GLOBAL.formElement;
  const cardItemRadio = formElement?.querySelectorAll('.zotlo-checkout__card-item input[type="radio"]') as NodeListOf<HTMLInputElement>;
  if (cardItemRadio.length > 0) cardItemRadio[0].checked = true;
  const allCardsButton = formElement?.querySelector('[data-all-cards-button]') as HTMLButtonElement;

  function closeAllCardsModal() {
    formElement?.querySelector('[data-modal="all-cards"]')?.remove();
  }

  function handleCardSelection() {
    const savedCardList = config?.paymentData?.savedCardList || [];
    const selectedCardId = getActiveSavedCardId({ config, groupName: SavedCardsGroupName.ON_ALL_CARDS_MODAL });
    if (!selectedCardId) return closeAllCardsModal();
    const selectedCard = savedCardList.find(card => card.creditCardId === selectedCardId);
    if (!selectedCard) return closeAllCardsModal();
    // Replace selected card on the payment form
    const selectedCardHtml = createSavedCardItem({ card: selectedCard, groupName: SavedCardsGroupName.ON_PAYMENT_FORM, config });
    const parser = new DOMParser();
    const selectedCardDOM = parser.parseFromString(selectedCardHtml, 'text/html')?.body.firstChild as HTMLElement;
    const existingCardOnForm = formElement?.querySelector(`.zotlo-checkout__card-item input[type="radio"][name="${SavedCardsGroupName.ON_PAYMENT_FORM}"]`)?.closest('.zotlo-checkout__card-item');
    existingCardOnForm?.remove();
    allCardsButton.after(selectedCardDOM);
    selectSavedCard({ cardId: selectedCardId, groupName: SavedCardsGroupName.ON_PAYMENT_FORM });
    closeAllCardsModal();
  }

  function handleAllCardsClick(this: HTMLElement) {
    const modalHTML = createAllCardsModal({ config });
    const parser = new DOMParser();
    let modalDOM = parser.parseFromString(modalHTML, 'text/html')?.body.firstChild as HTMLElement;

    // Add modal close action
    modalDOM?.querySelector('[data-all-cards-cancel-button]')?.addEventListener('click', handleClose);
    modalDOM?.querySelector('[data-all-cards-select-button]')?.addEventListener('click', handleCardSelection);

    formElement?.insertBefore(modalDOM, formElement?.firstChild as HTMLElement);
    const activeCardId = getActiveSavedCardId({ config });
    selectSavedCard({ cardId: activeCardId, groupName: SavedCardsGroupName.ON_ALL_CARDS_MODAL });

    modalDOM = formElement?.querySelector(`[data-modal="all-cards"]`) as HTMLElement;

    setTimeout(() => {
      modalDOM?.classList.remove('zotlo-checkout__modal-enter-from');
      modalDOM?.classList.remove('zotlo-checkout__modal-enter-active');
    }, 0)

    function handleClose(this: HTMLElement) {
      const closeBtn = this as HTMLElement;
      modalDOM?.classList.add('zotlo-checkout__modal-enter-from');
      modalDOM?.classList.add('zotlo-checkout__modal-enter-active');
      closeBtn.removeEventListener('click', handleClose);
      
      setTimeout(() => closeAllCardsModal(), 150);
    }
  }

  allCardsButton?.addEventListener('click', handleAllCardsClick);

  function destroy() {
    closeAllCardsModal();
    allCardsButton?.removeEventListener('click', handleAllCardsClick);
  }

  return { destroy };
}

export function getFooterPriceInfo(config: FormConfig) {
  const { $t } = useI18n(config?.general?.localization);
  const packageCondition = config?.packageInfo?.condition || 'package_with_trial';
  return template($t(`footer.priceInfo.${packageCondition}`), {
    ...getPackageTemplateParams(config)
  });
}

export function getSubmitButtonContent(config: FormConfig) {
  const { $t } = useI18n(config?.general?.localization);
  const packageState = config?.packageInfo?.state || 'subscriptionActivationState';
  const buttonKey = ZOTLO_GLOBAL.cardUpdate
    ? $t('form.button.text.cardUpdate.0')
    : config?.design.button.text?.[packageState];

  const buttonText = (typeof buttonKey === 'string' && !!buttonKey)
    ? buttonKey
    : $t(`form.button.text.${packageState}.${buttonKey}`);
  const buttonContent = template(buttonText, {
    ...getPackageTemplateParams(config)
  });
  return buttonContent;
}

export async function handlePriceChangesBySubscriptionStatus(config: FormConfig) {
  const { $t } = useI18n(config?.general?.localization);
  if (!ZOTLO_GLOBAL.formElement) return;

  function updateElementsValue<T extends HTMLElement>(
    selector: string,
    value: string | undefined
  ) {
    ZOTLO_GLOBAL.formElement?.querySelectorAll(selector).forEach((el) => {
      (el as T).innerHTML = value || "";
    });
  }

  updateElementsValue<HTMLElement>('[data-total-price]', config?.packageInfo?.totalPayableAmount);
  updateElementsValue<HTMLButtonElement>('[data-card-submit-button]', getSubmitButtonContent(config));
  updateElementsValue<HTMLElement>('[data-original-price]', config?.packageInfo?.discount?.original as string);
  updateElementsValue<HTMLElement>('[data-discount-price]', config?.packageInfo?.discount?.price as string);
  const footerFullDescription = `${getFooterPriceInfo(config)} ${$t('footer.desc')}`;
  updateElementsValue<HTMLElement>('[data-footer-description]', footerFullDescription);
}

export function syncInputsOnTabs(tabName: string | null, inputNames: string[]) {
  setTimeout(() => {
    inputNames.forEach(inputName => {
      const cardInput = document?.querySelector(`[data-tab-content="creditCard"] input[name="${inputName}"]`) as HTMLInputElement;
      const providersInput = document?.querySelector(`[data-tab-content="subscriberId"] input[name="${inputName}"]`) as HTMLInputElement;
      const isCreditCardTab = tabName === PaymentProvider.CREDIT_CARD;
      // Sync inputs based on the active tab and trigger blur event to update validation
      if (isCreditCardTab && cardInput) {
        cardInput.value = providersInput?.value;
        if (cardInput.value) cardInput?.dispatchEvent(new Event('blur'));
      } else if (providersInput) {
        providersInput.value = cardInput?.value;
        if (providersInput.value) providersInput?.dispatchEvent(new Event('blur'));
      }
    });
  }, 0);
}

export function getActiveSavedCardId(params: { providerKey?: PaymentProvider; config: FormConfig; groupName?: SavedCardsGroupName }): number {
  const { providerKey = PaymentProvider.CREDIT_CARD, config, groupName = SavedCardsGroupName.ON_PAYMENT_FORM } = params;
  if (providerKey !== PaymentProvider.CREDIT_CARD || !config.general?.showSavedCards) return 0;
  const checkedInput = ZOTLO_GLOBAL.formElement?.querySelector<HTMLInputElement>(`input[type="radio"][name="${groupName}"]:checked`);
  const cardId = +(checkedInput?.value || 0);
  return cardId;
}

export function getIsSavedCardPayment(params: { providerKey?: PaymentProvider; config: FormConfig }): boolean {
  const { providerKey = PaymentProvider.CREDIT_CARD, config } = params;
  const cardId = getActiveSavedCardId({
    providerKey,
    config,
    groupName: SavedCardsGroupName.ON_PAYMENT_FORM
  });
  return cardId > 0;
}

export function prepareFooterInfo(params: { config: FormConfig }) {
  const { config } = params;
  const { $t } = useI18n(config.general?.localization);
  const privacyUrl = config.general.privacyUrl;
  const tosUrl = config.general.tosUrl;
  const zotloUrls = config?.general?.zotloUrls || {};
  const PaymentAggregator = 'https://3p-assets.cdnztl.com/docs/2025/09/10/jigle-payment-terms-ru.pdf'

  const footerInfo = {
    SHOW_FOOTER_DESC: true,
    PRICE_INFO: '',
    FOOTER_DESC: $t('footer.desc'),
    DISCLAIMER: '',
    ZOTLO_LEGALS_DESC: $t('footer.zotlo.legals.desc'),
    ZOTLO_LEGALS_LINKS: `<a target="_blank" href="${zotloUrls?.termsOfService}">${$t('common.termsOfService')}</a><a target="_blank" href="${zotloUrls?.privacyPolicy}">${$t('common.privacyPolicy')}</a>`,
    PAYMENT_AGGREGATOR: config.general.countryCode === 'RU'
      ? $t('footer.zotlo.aggregator', {
        here: `<a target="_blank" href="${PaymentAggregator}">${$t('common.here')}</a>`
      }) 
      : ''
  }

  if (ZOTLO_GLOBAL.cardUpdate) {
    footerInfo.FOOTER_DESC = $t('footer.cardUpdate', {
      projectName: config.general.appName || ''
    });
  } else {
    const footerPriceInfo = getFooterPriceInfo(config);
    const disclaimer = !config?.design?.footer || config?.design?.footer?.showMerchantDisclaimer
      ? $t('footer.disclaimer', {
        termsOfUse: `<a target="_blank" href="${tosUrl}">${$t('common.termsOfUse')}</a>`,
        privacyPolicy: `<a target="_blank" href="${privacyUrl}">${$t('common.privacyPolicy')}</a>`,
      })
      : '';

    footerInfo.PRICE_INFO = footerPriceInfo;
    footerInfo.DISCLAIMER = disclaimer && `<div>${disclaimer}</div>`
  }

  return footerInfo;
}

export async function handleResponseRedirection(payload: {
  response: Record<string, any>;
  params: IZotloCardParams | IZotloCheckoutParams;
  sessionKey?: string;
}) {
  const { response, params, sessionKey } = payload;
  const { result } = response || {};
  const { status, redirectUrl, payment } = result || {};
  const returnUrl = payment?.returnUrl || '';
  const currentUrl = globalThis?.location?.href || '';
  const currentUrlBase = globalThis?.location.origin + globalThis?.location.pathname;
  const returnUrlObj = new URL(params?.returnUrl || '');
  const returnUrlBase = returnUrlObj.origin + returnUrlObj.pathname;
  const isSamePage = returnUrlBase === currentUrlBase;

  if (status === PaymentResultStatus.REDIRECT && !!redirectUrl && currentUrl) {
    if (!isSamePage) {
      deleteSession({ useCookie: !!params.useCookie, key: sessionKey });
    }
    globalThis.location.href = redirectUrl;
  }
  if (status === PaymentResultStatus.COMPLETE && payment) {
    if (returnUrl) {
      if (!isSamePage) {
        deleteSession({ useCookie: !!params.useCookie, key: sessionKey });
      }
      globalThis.location.href = returnUrl;
    }
  }
}
