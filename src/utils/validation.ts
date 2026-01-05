import { getCountryByCode, getCountryCodeByNumber, getIsSavedCardPayment, ZOTLO_GLOBAL } from "./index";
import { getCardMask } from "./getCardMask";
import { FormConfig, PaymentProvider } from "../lib/types";
import { FORM_ITEMS } from "../lib/fields";

type ValidationRule = (value: any, params: any[]) => true | string;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ValidateInput {
  name: string;
  validate: (bypass?: boolean) => ValidationResult;
  updateRule: (ruleString: string) => void;
  destroy: () => void;
}

const ValidationMessages = {
  messages: {
    _default: 'Invalid field',
    required: 'This field is required',
    minLength: 'Minimum item size should be 0:{min}',
    email: 'Invalid email format',
    expirationDate: 'Expiration Date is not valid.',
    card: 'Invalid card format',
    length: 'This field must be 0:{length} long',
    min: 'Minimum 0:{min} characters required',
    phone: 'Invalid phone number format'
  } as Record<string, string>
}

function getValidationMessage(key: string, params: any[] = []) {
  let message = ValidationMessages.messages[key] || ValidationMessages.messages._default;
  const parameters = [...new Set(message.match(/\d:\{(\w+)\}/gm) || [])];

  // Apply parameters
  for (const item of parameters) {
    const [strIndex] = item.split(':');
    message = message.replace(new RegExp(item, 'gm'), params[parseFloat(strIndex)] || '');
  }

  return message.replace(/\\d:\{(.*?)\}/g, (_, index) => params[index] || '');
}

export function updateValidationMessages(messages: Record<string, string>) {
  if (typeof messages !== 'object' || messages === null) return false;
  ValidationMessages.messages = messages;
}

export class Validator {
  private rules: Map<string, ValidationRule> = new Map();

  addRule(field: string, rule: ValidationRule) {
    if (!this.rules.has(field)) {
      this.rules.set(field, rule);
    }
    return this;
  }

  removeRule(field: string) {
    if (this.rules.has(field)) {
      this.rules.delete(field);
    }
    return this;
  }

  clearRules() {
    this.rules.clear();
    return this;
  }

  validate(value: any, rules: string): ValidationResult {
    // required|minLength:5|email
    const ruleList = (rules?.split('|') || []);
    const errors: string[] = [];

    for (const item of ruleList) {
      const [ruleName, param] = item.split(':');
      const rule = this.rules.get(ruleName.trim());
      const result = rule?.(value, [param]);

      if (rule && typeof result === 'string') {
        errors.push(result || getValidationMessage('_default'));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Common validation rules
export const ValidationRules = {
  required(value: any) {
    if (value !== undefined && value !== null && value !== '' && value !== false) {
      return true;
    }
    return getValidationMessage('required')
  },
  minLength(value: string, params: any[]) {
    const min = params[0];
    if (value.length < min) return getValidationMessage('minLength', [min]);
    return true;
  },
  email(value: string) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return true
    }
    return getValidationMessage('email');
  },
  expirationDate(value: string) {
    const pattern = /^(0[1-9]|1[0-2])\d{2}$/;
    const filteredValue = value.replace(/\//g, ""); // remove slashes
    if (!pattern.test(filteredValue)) {
      return  getValidationMessage('expirationDate');
    }
    return true;
  },
  card(value: string) {
    const card = getCardMask(value);
    const filteredValue = value.replace(/\s/g, ''); // remove spaces
    if (filteredValue.length === card.length) return true;
    return getValidationMessage('card');
  },
  length(value: string, params: any[]) {
    const length = params[0];
    if (value.length === length) return true;
    return getValidationMessage('length', [length])
  },
  min(value: string, params: any[]) {
    const length = params[0];
    if (value.length >= length) return true;
    return getValidationMessage('min', [length]);
  },
  phone(value: string) {
    const clearPattern = /[\s-()+]/g
    const code = getCountryCodeByNumber(value, false);
    const country = getCountryByCode(code);

    if (value.replace(clearPattern, '').length !== country?.maskLength) {
      return getValidationMessage('phone');
    }
    return true;
  },
  zipCode(value: string) {
    const pattern = /^[\d-]*$/;
    const isValid = pattern.test(value);
    if (!isValid) return getValidationMessage('zipCode');
    return true;
  }
};

export let validatorInstance = null as Validator | null;

export function validateInput(input: HTMLInputElement, options?: {
  validateOnBlur?: boolean;
  onValidate?: (result: ValidationResult) => void;
}): ValidateInput {
  let ruleString = input.getAttribute('data-rules') || '';
  let rules = (ruleString?.split('|') || []);

  if (!validatorInstance) validatorInstance = new Validator();
  
  for (const rule of rules) {
    const [ruleName] = rule.split(':') as [keyof typeof ValidationRules, any];
    const ruleItem = ValidationRules[ruleName];
    validatorInstance.addRule(ruleName, ruleItem);
  }

  function updateRule(newRuleString: string) {
    if (!newRuleString) return;
    ruleString = newRuleString;
    rules = ruleString?.split('|') || [];
  }

  function validate(bypass?: boolean): ValidationResult {
    const value = input.type === 'checkbox' ? input.checked : input.value;
    if (!validatorInstance) return { isValid: !!bypass, errors: [] };
    const result = bypass
      ? { isValid: true, errors: [] }
      : validatorInstance.validate(value, ruleString);
    options?.onValidate?.(result);
    return result;
  }

  function handleInput() {
    validate();
  }

  if (input.type !== 'checkbox' && options?.validateOnBlur) {
    input.addEventListener('blur', handleInput);
  } else {
    input.addEventListener('input', handleInput);
  }

  function destroy() {
    input.removeEventListener('blur', handleInput);
    input.removeEventListener('input', handleInput);
  }

  return {
    name: input.name,
    validate,
    updateRule,
    destroy
  }
}


export function checkboxValidation(input: HTMLInputElement, result: ValidationResult) {
  const parent = input.parentElement as HTMLElement;
  const checkmark = parent.querySelector('[data-checkmark]') as HTMLElement;

  if (!result.isValid) {
    parent.classList.add('error');
    if (checkmark) checkmark.classList.add('error');
  } else {
    parent.classList.remove('error');
    if (checkmark) checkmark.classList.remove('error');
  }
}

export function inputValidation(input: HTMLInputElement, result: ValidationResult) {
  const parent = input.parentElement as HTMLElement;
  const errorElement = parent.parentElement?.querySelector('[data-error]') as HTMLElement;
  const messageElement = parent.parentElement?.querySelector('[data-message]') as HTMLElement;

  if (!result.isValid) {
    parent.classList.add('error');
    if (errorElement) errorElement.innerHTML = result.errors[0];
    if (messageElement) messageElement.style.display = 'none';
  } else {
    parent.classList.remove('error');
    if (errorElement) errorElement.innerHTML = '';
    if (messageElement) messageElement.style.display = '';
  }
}

export function validateForm(params: {
  providerKey: PaymentProvider;
  config: FormConfig;
  skipBillingFields?: boolean;
  validations: Record<string, ReturnType<typeof validateInput>>;
}) {
  const { providerKey, config, skipBillingFields, validations } = params;
  const errors = [];
  const creditCardFields = [
    FORM_ITEMS.CARD_NUMBER.input.name,
    FORM_ITEMS.CARD_HOLDER.input.name,
    FORM_ITEMS.SECURITY_CODE.input.name,
    FORM_ITEMS.EXPIRATION_DATE.input.name
  ];
  const sharedFields = [
    FORM_ITEMS.SUBSCRIBER_ID_EMAIL.input.name,
    FORM_ITEMS.AGREEMENT_CHECKBOX.input.name,

    // Zip code for US
    ...(config.general.countryCode === 'US'
      ? [FORM_ITEMS.ZIP_CODE.input.name]
      : []),

    // Billing fields
    ...(config.design?.businessPurchase?.enabled ? [
      FORM_ITEMS.BILLING_BUSINESS_NAME.input.name,
      FORM_ITEMS.BILLING_ADDRESS_LINE.input.name,
      FORM_ITEMS.BILLING_CITY_TOWN.input.name,
      FORM_ITEMS.BILLING_TAX_ID.input.name,
    ] : [])
  ];
  const isSavedCardPayment = getIsSavedCardPayment({ providerKey, config });

  for (const validation of Object.values(validations)) {
    const name = validation.name;
    const skipField = skipBillingFields && /^billing/.test(name);
    const shouldSkipValidation = isSavedCardPayment 
      ? creditCardFields.includes(name) && providerKey === PaymentProvider.CREDIT_CARD
      : skipField || (!sharedFields.includes(name) && providerKey !== PaymentProvider.CREDIT_CARD);

    const result = validation.validate(shouldSkipValidation);
    if (!result.isValid) {
      errors.push({ name, result });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function detectAndValidateForm(params: {
  config: FormConfig;
  validations: Record<string, ReturnType<typeof validateInput>>;
}) {
  const { config, validations } = params;
  const el = document.activeElement as HTMLInputElement;
  const container = ZOTLO_GLOBAL.container;

  // Detect which form if active element is an input
  if (['INPUT', 'BUTTON'].includes(el?.nodeName)) {
    if (!container?.contains(el)) return PaymentProvider.CREDIT_CARD;

    // Reset form validations
    for (const validation of Object.values(validations)) {
      validation.validate(true);
    }

    // Reset button types
    container?.querySelectorAll('button[data-provider]').forEach(btn => {
      btn.setAttribute('type', 'button');
    });

    if (el.nodeName === 'BUTTON') {
      const providerKey = el.dataset.provider as PaymentProvider;
      const toggleName = FORM_ITEMS.BILLING_ACTIVATE.input.name;
      const billingToggleCheckbox = ZOTLO_GLOBAL?.formElement?.querySelector(`input[name="${toggleName}"]`) as HTMLInputElement;
      const skipBillingFields = !!billingToggleCheckbox && !billingToggleCheckbox?.checked;

      validateForm({
        providerKey,
        config,
        validations,
        skipBillingFields
      });
      container?.querySelector('button[data-provider="' + providerKey + '"]')?.setAttribute('type', 'submit');
      return providerKey;
    }

    const name = el.name;

    // Credit card validation
    if (name.startsWith('card')) {
      validateForm({
        providerKey: PaymentProvider.CREDIT_CARD,
        config,
        validations
      });
      container?.querySelector('button[data-provider="creditCard"]')?.setAttribute('type', 'submit');
      return PaymentProvider.CREDIT_CARD;
    }
    
    const wrapper = el.closest('[data-form-type]');
    if (wrapper?.getAttribute('data-form-type') === 'subscriberId') {
      const button = wrapper.nextElementSibling?.querySelector('button[data-provider]') as HTMLButtonElement;

      if (button) {
        const providerKey = button.dataset.provider as PaymentProvider;
        validateForm({
          providerKey,
          config,
          validations
        });
        button.setAttribute('type', 'submit');
        return providerKey;
      }
    }
  }

  return PaymentProvider.CREDIT_CARD;
}
