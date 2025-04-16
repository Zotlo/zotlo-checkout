import type { FormConfig, IZotloCheckoutParams, IZotloCheckoutReturn } from "./types"
import { createForm } from "./create";
import { IMaskInputOnInput, maskInput } from "../utils/inputMask";
import { validateInput, ValidationResult } from "../utils/validation";
import { FORM_ITEMS } from "./fields";
import { getCardMask } from "../utils/getCardMask";
import { getCDNUrl } from "../utils/getCDNUrl";
import { createStyle } from "../utils/createStyle";
import { loadFontsOnPage } from "../utils/fonts";

async function ZotloCheckout(params: IZotloCheckoutParams): Promise<IZotloCheckoutReturn> {
  // TODO: initialize the checkout form here
  let config = { settings: {}, design: {} } as FormConfig;
  let containerId = '';
  let subscriberId = '';
  const maskItems: Record<string, ReturnType<typeof maskInput>> = {};
  const validations: Record<string, ReturnType<typeof validateInput>> = {};

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

  function validateForm() {
    const errors = []
    for (const validation of Object.values(validations)) {
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

  function getContainerElement() {
    if (!containerId) return null;
    return  document.getElementById(containerId);
  }

  function handleForm(e: Event) {
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
  }

  function refresh() {
    if (!containerId) return;

    if ((globalThis as any)?.getZotloConfig) {
      config = (globalThis as any)?.getZotloConfig?.() as FormConfig;
    }

    // Destroy previous form events
    destroy();

    const form = createForm({ subscriberId, config });
    const style = createStyle(config);
    const container = getContainerElement();

    loadFontsOnPage([config.design.fontFamily]);

    if (container) container.innerHTML = `<style>${style}</style>` + form;

    init();
  }

  function init() {
    const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
    const maskInputs = formElement?.querySelectorAll('input[data-mask]');
    const ruleInputs = formElement?.querySelectorAll('input[data-rules]');

    function formatCardMask(item: HTMLInputElement, options: IMaskInputOnInput) {
      const { value, mask: inputMask, updateValue } = options;
      const currentMask = getCardMask(value.replace(/\s/g, ''));

      // Update current mask by the mask that found
      inputMask.updateOptions({ mask: currentMask.mask.replace(/0/g, '#') });

      // Update input value
      updateValue();
      
      // Update CVV mask and validation
      const cvvLength = currentMask.name === 'American Express' ? 4 : 3;
      const cvvName = FORM_ITEMS.SECURITY_CODE.input.name;
      maskItems[cvvName].mask.updateOptions({ mask: ''.padEnd(cvvLength, '#') });
      maskItems[cvvName].updateValue();
      validations[cvvName].updateRule(`required|min:${cvvLength}`);

      // Show card image
      const rightSide = item.parentElement?.querySelector('[data-right]');

      if (rightSide) {
        if (!currentMask.icon) {
          rightSide.innerHTML = '';
          return;
        }

        const imgUrl = getCDNUrl('cards/{NAME}.svg').replace(/\{NAME\}/, currentMask.icon)

        if (rightSide.innerHTML) {
          const img = rightSide.querySelector('img');
          if (img && img.src !== imgUrl) {
            img.src = imgUrl;
            img.alt = currentMask.name
          }
        } else {
          rightSide.innerHTML = `<img src="${imgUrl}" alt="${currentMask.name}" class="h-24">`
        }
      }
    }

    function applyMaskAndValidation() {
      if (maskInputs) {
        for (const item of maskInputs as NodeListOf<HTMLInputElement>) {
          maskItems[item.name] = maskInput(item, {
            mask: item.getAttribute('data-mask') || '',
            onInput(payload) {
              if (payload.name === FORM_ITEMS.CARD_NUMBER.input.name) {
                formatCardMask(item, payload);
              }
            }
          });
        }
      }
  
      if (ruleInputs) {
        for (const item of ruleInputs as NodeListOf<HTMLInputElement>) {
          validations[item.name] = validateInput(item, {
            validateOnBlur: true,
            onValidate(result) {
              if (item.type === 'checkbox') {
                checkboxValidation(item, result);
              } else {
                inputValidation(item, result);
              }
            }
          });
        }
      }
    }

    applyMaskAndValidation();

    formElement?.addEventListener('submit', handleForm);

    params.events?.onLoad?.();
  }

  function destroy() {
    const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
    formElement?.removeEventListener('submit', handleForm);

    for (const mask of Object.values(maskItems)) {
      mask.destroy();
    }

    for (const item of Object.values(validations)) {
      item.destroy();
    }

    const container = getContainerElement();
    if (container) container.innerHTML = '';
  }

  function mount(id: string) {
    if (containerId) return;

    containerId = id;
    refresh();
  }

  return {
    mount,
    refresh,
    destroy
  }
}

export { ZotloCheckout }
