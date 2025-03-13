import type { IZotloCheckoutParams } from "./types"
import { createForm, FORM_ITEMS } from "./create";
import { maskInput } from "../utils/inputMask";
import { validateInput, ValidationResult } from "../utils/validation";

async function ZotloCheckout(params: IZotloCheckoutParams) {
  // TODO: initialize the checkout form

  function getFormValues(form: HTMLFormElement) {
    const payload: Partial<Record<string, any>> = {};

    for (const item of Object.values(FORM_ITEMS)) {
      const name = item.input.name;
      if (name) {
        const input = form.elements.namedItem(name) as HTMLInputElement;
        payload[name] = input?.type === 'checkbox' ? !!input?.checked : input?.value || '';
      }
    }

    return payload;
  }

  function mount(id: string) {
    const form = createForm({ subscriberId: '' });
    const container = document.getElementById(id)
    if (container) container.innerHTML = form;

    const formElement = document.getElementById('zotlo-checkout-form');
    const maskInputs = formElement?.querySelectorAll('input[data-mask]');
    const ruleInputs = formElement?.querySelectorAll('input[data-rules]');
    const validations = [] as (ReturnType<typeof validateInput>)[];

    function checkboxValidation(input: HTMLInputElement, result: ValidationResult) {
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

    function inputValidation(input: HTMLInputElement, result: ValidationResult) {
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

    if (maskInputs) {
      for (const item of maskInputs as NodeListOf<HTMLInputElement>) {
        maskInput(item, {
          mask: item.getAttribute('data-mask') || ''
        });
      }
    }

    if (ruleInputs) {
      for (const item of ruleInputs as NodeListOf<HTMLInputElement>) {
        const validation = validateInput(item, {
          validateOnBlur: true,
          onValidate(result) {
            if (item.type === 'checkbox') {
              checkboxValidation(item, result);
            } else {
              inputValidation(item, result);
            }
          }
        });

        validations.push(validation)
      }
    }

    function validateForm() {
      const errors = []
      for (const validation of validations) {
        const result = validation.validate();
        if (!result.isValid) {
          errors.push({ name: validation.name, result });
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    }
    

    formElement?.addEventListener('submit', (e) => {
      e.preventDefault();
      const validation = validateForm();

      if (!validation.isValid) return;

      const result = getFormValues(e.target as HTMLFormElement);
      const [cardExpirationMonth, cardExpirationYear] = result.cardExpiration.split('/');

      const payload = {
        providerKey: 'creditCard',
        packageId: params.packageId,
        acceptPolicy: result.acceptPolicy,
        creditCardDetails: {
          email: result.subscriberId,
          cardNumber: result.cardNumber.replace(/\s/g, ''),
          cardHolder: result.cardHolder,
          cardCVV: result.cardCVV,
          cardExpirationMonth: cardExpirationMonth,
          cardExpirationYear: cardExpirationYear
        }
      }

      console.log('Form submitted!', payload);

      params.events?.onSubmit?.();
    });

    params.events?.onLoad?.();
  }

  return {
    mount
  }
}

export { ZotloCheckout }
