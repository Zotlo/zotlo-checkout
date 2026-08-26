import Countries from '../countries.json';
import { DesignTheme, type FormConfig, type IZotloCardParams, type IZotloCheckoutParams, PaymentProvider, PaymentResultStatus, SavedCardsGroupName, type FooterInfo, type FormSetting, PackageType, PackageCondition } from '../lib/types';
import { createAllCardsModal, createPriceTable, createSavedCardItem, createButton } from '../lib/create';
import { getPackageTemplateParams } from './getPackageInfo';
import { getCDNUrl } from './getCDNUrl';
import { useI18n } from './i18n';
import { template } from "./template";
import { deleteSession } from './session';
import { FORM_ITEMS } from '../lib/fields';
import { COOKIE, getCookie } from './cookie';
import { CheckoutAPI } from './api';

export { getCDNUrl } from './getCDNUrl';
export { useI18n } from './i18n';
export { calculatePaymentStartDate } from './paymentStartCalculation';

type Country = typeof Countries[0];

export const ZOTLO_GLOBAL = {
  cardUpdate: false,
  data: {
    subscriberId: '',
    discountCode: '',
  },
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
  },

  reset() {
    this.data.subscriberId = '';
    this.containerId = '';
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
    const isPanelEditMode = import.meta.env.VITE_CONSOLE;
    const isAvailable = isPanelEditMode ? true : !!config?.paymentData?.providers?.[item?.providerKey];
    const isPixAvailable = isPanelEditMode ? !!config.general?.showPix : !!config?.paymentData?.providers?.[PaymentProvider.PIX];
    const isAlipayAvailable = isPanelEditMode ? !!config.general?.showAliPay : !!config?.paymentData?.providers?.[PaymentProvider.ALIPAY];
    const isApplePayCanMakePayments = isPanelEditMode ? true : config?.providerConfigs?.applePay?.canMakePayments;
    const isGooglePayReadyToPay = isPanelEditMode ? true : config?.providerConfigs?.googlePay?.isReadyToPay;
    if (item.providerKey === PaymentProvider.APPLE_PAY) return isApplePayCanMakePayments && isAvailable;
    if (item.providerKey === PaymentProvider.GOOGLE_PAY) return isGooglePayReadyToPay && isAvailable;
    if (item.providerKey === PaymentProvider.PAYPAL) return config.general.showPaypal;
    if (item.providerKey === PaymentProvider.PIX) return isPixAvailable;
    if (item.providerKey === PaymentProvider.ALIPAY) return isAlipayAvailable;
    return isAvailable;
  }) || [];
}

export function isPixAvailable(config: FormConfig) {
  return preparePaymentMethods(config).some((method) => method.providerKey === PaymentProvider.PIX);
}

export function isDLocalEnabled(config: FormConfig) {
  return !!config?.paymentData?.dLocal;
}

// The CPF/CNPJ field is rendered when dLocal is enabled (all methods) or when
// PIX is available (PIX-only behaviour).
export function isCpfCnpjAvailable(config: FormConfig) {
  return isDLocalEnabled(config) || isPixAvailable(config);
}

export function generateTabButtons(config: FormConfig, paymentMethods: FormSetting['paymentMethodSetting']) {
    const { $t } = useI18n(config?.general?.localization);
    const theme = {
      [PaymentProvider.CREDIT_CARD]: { dark: '.png', light: '_black.png' },
      [PaymentProvider.PAYPAL]: { dark: '_disabled.png', light: '.png' },
      [PaymentProvider.GOOGLE_PAY]: { dark: '.svg', light: '.svg' },
      [PaymentProvider.APPLE_PAY]: { dark: '.svg', light: '.svg' },
      [PaymentProvider.PIX]: { dark: '_white.svg', light: '.svg' },
      [PaymentProvider.ALIPAY]: { dark: '_white.svg', light: '_black.svg' }
    }

    const tabButtons = paymentMethods.reduce((acc, item, index) => {
      const postfix = theme[item.providerKey]?.[config.design.darkMode ? 'dark' : 'light'];
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

    return tabButtons;
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
  let loaderEl = formElement.querySelector('.zotlo-checkout__form-loader') as HTMLDivElement;
  if (loading) {
    if (!loaderEl) {
      loaderEl = document.createElement('div');
      loaderEl.className = 'zotlo-checkout__form-loader';
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
  const params = getPackageTemplateParams(config);

  if (config.general.isActiveFTC) {
    if (config.paymentData?.package?.packageType === PackageType.SUBSCRIPTION) return '';
    return template($t('footer.legals.oneTimeInfo'), params);
  }

  const packageCondition = config?.packageInfo?.condition || PackageCondition.PACKAGE_WITH_TRIAL;
  const isDiscountCodeApplied = getIsDiscountCodeApplied(config);
  const isTrialDiscountAllowed = !!config?.paymentData?.discount?.allowTrial || false;
  const isRecurringDiscountLimited = (config?.paymentData?.discount?.recurringMode === 'limited') || false;

  const discountTrialKey = isTrialDiscountAllowed ? 'allowTrialDiscount' : 'noTrialDiscount';
  const discountRecurringKey = isRecurringDiscountLimited ? 'recurringLimited' : 'recurringForever';
  const finalLocalizationKey = isDiscountCodeApplied ? 
    `footer.priceInfo.discounted.${packageCondition}.${discountTrialKey}.${discountRecurringKey}` : 
    `footer.priceInfo.${packageCondition}`;

  return template($t(finalLocalizationKey), params);

}

export function getSubmitButtonContent(config: FormConfig) {
  const { $t } = useI18n(config?.general?.localization);
  const packageState = config?.packageInfo?.state || 'subscriptionActivationState';
  const buttonKey = ZOTLO_GLOBAL.cardUpdate
    ? $t('form.button.text.cardUpdate.0')
    : config?.design.button.text?.[packageState];

  const buttonText = (typeof buttonKey === 'string' && !!buttonKey)
    ? buttonKey
    : $t(`form.button.state.${packageState}.${buttonKey}`);

  let params = getPackageTemplateParams(config);

  if (packageState === 'subscriptionActivationState') {
    switch(buttonKey) {
      case 0: case 2:
      case 3: case 4:
      case 5: case 6:
        params.PERIOD = params.PERIOD_NAMING;
        params.TRIAL_PERIOD = params.TRIAL_PERIOD_NAMING;
        break;
      case 1:
        params.PERIOD = params.PERIOD_TYPE;
        params.TRIAL_PERIOD = params.TRIAL_PERIOD_TYPE;
        break;
    }
  }

  return template(buttonText, params);
}

export async function handlePriceChanges(config: FormConfig) {
  if (!ZOTLO_GLOBAL.formElement) return;

  function updateElementsValue<T extends HTMLElement>(
    selector: string,
    value: string | undefined
  ) {
    ZOTLO_GLOBAL.formElement?.querySelectorAll(selector).forEach((el) => {
      (el as T).innerHTML = value || "";
    });
  }

  updateElementsValue<HTMLElement>('[data-total-price]', config?.packageInfo?.totalPayableAmount as string);
  updateElementsValue<HTMLButtonElement>('[data-card-submit-button]', getSubmitButtonContent(config));
  updateElementsValue<HTMLElement>('[data-original-price]', config?.packageInfo?.discount?.original as string);
  const footerFullDescription = getFooterPriceInfo(config);
  updateElementsValue<HTMLElement>('[data-footer-description]', footerFullDescription);

  if (config.general.canViewPriceTable) {
    const priceTable = createPriceTable({config});
    updateElementsValue<HTMLElement>('[data-price-table]', priceTable);
  }
}

export function getIsDiscountCodeApplied(config: FormConfig): boolean {
  return !!config?.paymentData?.discount?.code;
}

export function syncInputsOnTabs(tabName: string | null, inputNames: string[]) {
  setTimeout(() => {
    inputNames.forEach(inputName => {
      const cardInput = ZOTLO_GLOBAL.formElement?.querySelector(`[data-tab-content="creditCard"] input[name="${inputName}"]`) as HTMLInputElement;
      const providersInputs = ZOTLO_GLOBAL.formElement?.querySelectorAll<HTMLInputElement>(`[data-tab-content="subscriberId"] input[name="${inputName}"]`);
      const isCreditCardTab = tabName === PaymentProvider.CREDIT_CARD;

      // Sync inputs based on the active tab and trigger blur event to update validation
      if (Object.prototype.hasOwnProperty.call(ZOTLO_GLOBAL.data, inputName)) {
        const value = (ZOTLO_GLOBAL.data as any)[inputName] || '';
        if (isCreditCardTab && cardInput) {
          cardInput.value = value;
          if (cardInput.value) cardInput?.dispatchEvent(new Event('blur'));
        } else if (providersInputs) {
          providersInputs?.forEach((providersInput) => {
            providersInput.value = value;
            if (providersInput.value) providersInput?.dispatchEvent(new Event('blur'));
          });
        }
      }
    });
  }, 0);
}

export function toggleCpfCnpjVisibility(show: boolean) {
  const fields = ZOTLO_GLOBAL.formElement?.querySelectorAll('[data-cpf-cnpj-field]');
  fields?.forEach((field) => {
    (field as HTMLElement).style.display = show ? '' : 'none';
  });
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
  const isRussia = config.general.countryCode === 'RU';
  const PaymentAggregator = 'https://3p-assets.cdnztl.com/docs/2025/09/10/jigle-payment-terms-ru.pdf'
  const appName = config.general.appName || '';
  const ruName = $t('footer.legals.jigleName');
  const zotloName = isRussia ? ruName : $t('footer.legals.zotloName');
  const zotloTitle = isRussia ? ruName : $t('footer.legals.zotloTitle');

  const footerInfo: FooterInfo = {
    SHOW_FOOTER_DESC: true,
    PRICE_INFO: '',
    FOOTER_DESC: '',
    DISCLAIMER: '',
    AGREEMENT_TEXT: $t('footer.legals.agreement', {
      appName,
      zotloName,
      termsOfUse: `<a target="_blank" href="${tosUrl}">${$t('common.termsOfUse')}</a>`,
      privacyPolicy: `<a target="_blank" href="${privacyUrl}">${$t('common.privacyPolicy')}</a>`,
      zotloTerms: `<a target="_blank" href="${zotloUrls?.termsOfService}">${$t('common.termsOfService')}</a>`,
      zotloPrivacy: `<a target="_blank" href="${zotloUrls?.privacyPolicy}">${$t('common.privacyPolicy')}</a>`
    }),
    MOR_INFO: $t('footer.legals.morInfo', { appName, zotloName, zotloTitle }),
    CHARGE_STATEMENT: isRussia ? '' : $t('footer.legals.chargeStatement', { statementName: config.general.statementName }),
    PAYMENT_AGGREGATOR: isRussia
      ? $t('footer.zotlo.aggregator', {
        here: `<a target="_blank" href="${PaymentAggregator}">${$t('common.here')}</a>`
      }) 
      : '',
    ZOTLO_ADDRESS_TEXT: isRussia ? '' : $t('footer.zotlo.legals.address'),
  }

  if (ZOTLO_GLOBAL.cardUpdate) {
    footerInfo.FOOTER_DESC = $t('footer.cardUpdate', {
      projectName: appName
    });
  } else {
    const footerPriceInfo = getFooterPriceInfo(config);
    footerInfo.PRICE_INFO = footerPriceInfo;
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

async function sha256(message: string) {
  // encode as (utf-8) Uint8Array
  const msgBuffer = new TextEncoder().encode(message);                    

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert buffer to byte array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string                  
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function parseQueryString(query: string) {
  const list = (query ? (query.charAt(0) === '?' ? query.slice(1) : query) : '').split('#');
  const qStr = list[0] || '';

  return qStr.split('&').reduce((acc, str) => {
    const [ key, value ] = str.split('=');

    if (key && !Object.prototype.hasOwnProperty.call(acc, key)) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
}

export async function getUserDataForIntegration(payload: {
  registerType: string;
  subscriberId?: string;
}) {
  const { registerType, subscriberId } = payload || {};
  const hashedSubscriberId = subscriberId ? await sha256(subscriberId) : undefined;
  const isEmail = subscriberId && (''+subscriberId.includes('@') || ''+subscriberId.includes('@privaterelay.appleid.com'));
  const registerFinalType = registerType === 'other'
    ? isEmail ? 'email' : undefined
    : registerType;

  const userData: Record<string, any> = {
    ...(registerFinalType && hashedSubscriberId ? {[registerFinalType === 'email' ? 'em' : 'ph']: hashedSubscriberId} : {}),
  }

  const context = {
    ...(registerFinalType && hashedSubscriberId ? {[registerFinalType === 'email' ? 'email' : 'phone_number']: hashedSubscriberId} : {})
  }

  return {
    user_data: userData,
    context
  }
}

export function sendIntegrationCAPIInfo() {
  if (import.meta.env.VITE_CONSOLE) return;

  const tiktokParams = prepareTiktokCAPIParams(window.location.href);
  const fbParams = prepareFBCAPIParams(window.location.href);
  const hasAnyTiktokValue = !!Object.values(tiktokParams).filter(Boolean).length;
  const hasAnyFbValue = !!Object.values(fbParams).filter(Boolean).length;
  const payload = {} as Record<'ttclid' | 'fbclid', string>;

  if (hasAnyTiktokValue) {
    payload.ttclid = tiktokParams[COOKIE.TTCLICK_ID] || '';
  }

  if (hasAnyFbValue) {
    payload.fbclid = fbParams[COOKIE.FBCLICK_ID] || '';
  }

  if (Object.keys(payload).length === 0) return;

  CheckoutAPI.post('/clickId', payload);
}

function prepareTiktokCAPIParams(siteUrl: string, ttParams?: Record<string, string>) {
  ttParams = ttParams || {
    [COOKIE.TTCLICK_ID]: getCookie(COOKIE.TTCLICK_ID) || '',
    [COOKIE.TTBROWSER_ID]: getCookie(COOKIE.TTBROWSER_ID) || ''
  };

  const location = new URL(`${siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}`);
  const { ttclid } = parseQueryString(location?.search || '');

  if (!ttParams[COOKIE.TTCLICK_ID] && ttclid) {
    ttParams[COOKIE.TTCLICK_ID] = ttclid || '';
  }

  return ttParams;
}

function prepareFBCAPIParams(siteUrl: string, fbParams?: Record<string, string>) {
  fbParams = fbParams || {
    [COOKIE.FBCLICK_ID]: getCookie(COOKIE.FBCLICK_ID) || '',
    [COOKIE.FBBROWSER_ID]: getCookie(COOKIE.FBBROWSER_ID) || ''
  };

  const location = new URL(`${siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}`);
  const { fbclid } = parseQueryString(location?.search || '');

  if (!fbParams[COOKIE.FBCLICK_ID] && fbclid) {
    fbParams[COOKIE.FBCLICK_ID] = fbclid || '';
  }

  return fbParams;
}
