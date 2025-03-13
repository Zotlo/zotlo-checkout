import { getCardMask } from "./getCardMask";

type ValidationRule = (value: any, params: any[]) => true | string;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ValidateInput {
  name: string;
  validate: () => ValidationResult,
  updateRule: (ruleString: string) => void;
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
        errors.push(result || 'Invalid field');
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
    return 'This field is required'
  },
  minLength(value: string, params: any[]) {
    const min = params[0];
    if (value.length < min) return `Minimum length is ${min}`
    return true;
  },
  email(value: string) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return true
    }
    return 'Invalid email format'
  },
  expirationDate(value: string) {
    const pattern = /^(0[1-9]|1[0-2])\d{2}$/;
    const filteredValue = value.replace(/\//g, ""); // remove slashes
    if (!pattern.test(filteredValue)) {
      return 'Expiration Date is not valid.';
    }
    return true;
  },
  card(value: string) {
    const card = getCardMask(value);
    const filteredValue = value.replace(/\s/g, ''); // remove spaces
    if (filteredValue.length === card.length) return true;
    return 'Invalid card format';
  },
  length(value: string, params: any[]) {
    const length = params[0];
    if (value.length === length) return true;
    return `Length must be ${length}`;
  },
  min(value: string, params: any[]) {
    const length = params[0];
    if (value.length >= length) return true;
    return `Minimum ${length} characters required`;
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

  return {
    name: input.name,
    validate,
    updateRule
  }
}
