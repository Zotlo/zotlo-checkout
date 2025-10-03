import Countries from '../countries.json';
import { type FormConfig, PaymentProvider } from '../lib/types';
import { getPackageTemplateParams } from './getPackageInfo';
import { useI18n } from './i18n';
import { template } from "./template";

export { getCDNUrl } from './getCDNUrl';
export { useI18n } from './i18n';

type Country = typeof Countries[0];

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
  const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
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
  const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
  const inputs = formElement?.querySelectorAll('input, select, button') as NodeListOf<HTMLInputElement>;
  const wrappers = formElement?.querySelectorAll('.zotlo-checkout__input, .zotlo-checkout__checkbox') as NodeListOf<HTMLElement>;
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
  const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
  const subscriberIdInputs = formElement?.querySelectorAll('input[name="subscriberId"]') as NodeListOf<HTMLInputElement>;
  subscriberIdInputs?.forEach(input => {
    input?.removeAttribute('disabled');
    const wrapper = input?.closest('.zotlo-checkout__input');
    if (wrapper) wrapper.classList.remove('disabled');
  });
}

export function handleSubscriberIdInputEventListeners(action: 'add' | 'remove' = 'add', triggerFunction: () => void, ) {
  const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
  const subscriberIdInputs = formElement?.querySelectorAll('input[name="subscriberId"]') as NodeListOf<HTMLInputElement>;
  subscriberIdInputs?.forEach(input => {
    if (action === 'add') {
      input.addEventListener('input', triggerFunction);
    } else {
      input.removeEventListener('input', triggerFunction);
    }
  });
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
  const buttonKey = config?.design.button.text?.[packageState];
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
  const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
  if (!formElement) return;

  function updateElementsValue<T extends HTMLElement>(
    selector: string,
    value: string | undefined
  ) {
    formElement.querySelectorAll(selector).forEach((el) => {
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

export function syncSubscriberIdInputs(tabName: string | null) {
  setTimeout(() => {
    const cardInput = document?.querySelector('[data-tab-content="creditCard"] input[name="subscriberId"]') as HTMLInputElement;
    const providersInput = document?.querySelector('[data-tab-content="subscriberId"] input[name="subscriberId"]') as HTMLInputElement;
    const isCreditCardTab = tabName === PaymentProvider.CREDIT_CARD;
    // Sync subscriberId inputs based on the active tab and trigger blur event to update validation
    if (isCreditCardTab && cardInput) {
      cardInput.value = providersInput?.value;
      if (cardInput.value) cardInput?.dispatchEvent(new Event('blur'));
    } else if (providersInput) {
      providersInput.value = cardInput?.value;
      if (providersInput.value) providersInput?.dispatchEvent(new Event('blur'));
    }
  }, 0);
}
