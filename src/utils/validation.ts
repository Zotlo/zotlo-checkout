import { getCountryByCode, getCountryCodeByNumber } from "./index";
import { getCardMask } from "./getCardMask";

type ValidationRule = (value: any, params: any[]) => true | string;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ValidateInput {
  name: string;
  validate: () => ValidationResult;
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
  }
};

let validatorInstance = null as Validator | null;

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

  function validate(): ValidationResult {
    const value = input.type === 'checkbox' ? input.checked : input.value;
    if (!validatorInstance) return { isValid: false, errors: [] };    
    const result = validatorInstance.validate(value, ruleString);
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
