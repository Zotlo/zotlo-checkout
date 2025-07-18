import Countries from '../countries.json';
import { type FormConfig, PaymentProvider } from '../lib/types';

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

export function isJSON(val: string) {
  try { JSON.parse(val); } catch { return false }
  return true;
} 

function toPrimitive(val: string) {
  if (val === 'true' || val === 'false') return !!+new Boolean(val);
  if (val === 'undefined') return undefined;
  if (val === 'null') return null;
  if (!isNaN(Number(val))) return Number(val);
  if (isJSON(val)) {
    const obj = JSON.parse(val);
    if (Array.isArray(obj)) return obj;
  }
  return val?.replace(/^('|")/g, '')?.replace(/('|")$/g, '');
}

export function template(templateString: string, data: Record<string, any>) {
  let newString = templateString;
  const parameters = [...new Set(templateString.match(/\{\{(\w+)\}\}/gm) || [])];
  const conditionsRegex = /<% IF\((?<condition>(.*?))\) %>(?<content>(.*?))<% ENDIF %>/gms;  

  let matched;
  while ((matched = conditionsRegex.exec(templateString)) !== null) {
    let cleanContent = '';
    const [key, value] = matched?.groups?.condition.split('===').map(item => item.trim()) || [];
    const dataValue = data[key];
    const templateContent = matched[0];
    const parsedValue = toPrimitive(value);
    const hasKey = Object.prototype.hasOwnProperty.call(data, key);
    const hasCondition = (
      Array.isArray(parsedValue)
        ? parsedValue.includes(dataValue)
        : value === undefined
          ? !!dataValue
          : dataValue === parsedValue
    );

    // If the condition is true, we get the content
    if (hasKey && hasCondition) {
      cleanContent = matched?.groups?.content || '';
    }

    // Clear string
    newString = newString.replace(templateContent, cleanContent);

    // This is necessary to avoid infinite loops with zero-width matches
    if (matched.index === conditionsRegex.lastIndex) {
      conditionsRegex.lastIndex++;
    }
  }

  // Apply parameters
  for (const item of parameters) {
    const key = item.replace(/\{|\}/gm, '');
    newString = newString.replace(new RegExp(item, 'gm'), () => {
      const value = data[key];
      return value !== undefined ? value : item;
    });
  }

  return newString
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

