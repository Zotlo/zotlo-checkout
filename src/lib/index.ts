import type { FormConfig, IZotloCheckoutParams, IZotloCheckoutReturn } from "./types"
import { createForm } from "./create";
import { IMaskInputOnInput, maskInput } from "../utils/inputMask";
import { validateInput, type ValidationResult, updateValidationMessages } from "../utils/validation";
import { FORM_ITEMS } from "./fields";
import { getCardMask } from "../utils/getCardMask";
import { getCDNUrl } from "../utils/getCDNUrl";
import { createStyle } from "../utils/createStyle";
import { loadFontsOnPage } from "../utils/fonts";
import { getCountryByCode, getMaskByCode } from "../utils";

async function ZotloCheckout(params: IZotloCheckoutParams): Promise<IZotloCheckoutReturn> {
  let config = { general: {}, settings: {}, design: {} } as FormConfig;

  if (!import.meta.env.VITE_CONSOLE) {
    // TODO: initialize the checkout form here
  }

  let containerId = '';
  const subscriberId = params.subscriberId || '';
  const maskItems: Record<string, ReturnType<typeof maskInput>> = {};
  const validations: Record<string, ReturnType<typeof validateInput>> = {};
  const selectboxList: Record<string, ReturnType<typeof loadSelectbox>> = {};

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

    console.log('Form submitted!', payload, result);

    params.events?.onSubmit?.();
  }

  function refresh() {
    if (!containerId) return;

    if (import.meta.env.VITE_CONSOLE) {
      if ((globalThis as any)?.getZotloConfig) {
        config = (globalThis as any)?.getZotloConfig?.() as FormConfig;
      }
    }
    
    updateValidationMessages(config.general.localization.form.validation.rule);

    // Destroy everything before re-rendering
    unmount();

    const form = createForm({ subscriberId, config });
    const style = createStyle(config);
    const container = getContainerElement();

    loadFontsOnPage([config.design.fontFamily]);

    if (container) container.innerHTML = `<style>${style}</style>` + form;

    init();
  }

  function loadSelectbox(item: HTMLElement, options: {
    onSelect: (value: string) => void;
  }) {
    const toggle = item.querySelector('[data-select-toggle]') as HTMLElement;
    const items = item.querySelectorAll('[data-select-list] [data-select-item]') as NodeListOf<HTMLElement>;
    const selectbox = item.querySelector('select') as HTMLSelectElement;

    function closeSelectbox() {
      item.setAttribute('data-toggle', 'closed');
    }

    function clickOutside(e: MouseEvent) {
      const closest = (e.target as HTMLElement).parentElement?.closest('[data-select]')
      if (!closest) {
        closeSelectbox();
        document.removeEventListener('click', clickOutside);
      }
    }

    function toggleSelectbox() {
      const dataToggle = item.getAttribute('data-toggle') === 'open' ? 'closed' : 'open';
      item.setAttribute('data-toggle', dataToggle);

      if (dataToggle === 'open') {
        document.addEventListener('click', clickOutside);
        item.querySelector('[data-select-list] [data-selected="true"]')?.scrollIntoView({ block: 'center' });
      }
    }

    function selectItem(this: HTMLElement) {
      const target = this as HTMLElement;
      const value = target?.getAttribute('data-value');

      for (const item of items) {
        item.setAttribute('data-selected', 'false');
      }

      target.setAttribute('data-selected', 'true');
      const textElement = target.querySelector('[data-select-text]') as HTMLElement;
      toggle.innerHTML = target.outerHTML.replace(new RegExp(textElement.innerText, 'gm'), value || '');
      selectbox.value = value || '';
      options.onSelect(value || '');

      closeSelectbox();
    }

    function init() {
      toggle?.addEventListener('click', toggleSelectbox);

      for (const item of items) {
        item.addEventListener('click', selectItem);
      }
    }

    function destroy() {
      toggle.removeEventListener('click', toggleSelectbox);
      document.removeEventListener('click', clickOutside);

      for (const item of items) {
        item.removeEventListener('click', selectItem);
      }
    }

    init();

    return {
      init,
      destroy
    }
  }

  function init() {
    const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
    const maskInputs = formElement?.querySelectorAll('input[data-mask]');
    const ruleInputs = formElement?.querySelectorAll('input[data-rules]');
    const selectboxes = getContainerElement()?.querySelectorAll('[data-select]');

    function updatePhoneMask(code: string, input: HTMLInputElement) {
      const country = getCountryByCode(code);
  
      if (country) {
        const mask = getMaskByCode(country);
        input.setAttribute('data-mask', mask);
        maskItems[input.name].mask.updateOptions({ mask });
        maskItems[input.name].updateValue();
      }
    }

    for (const item of selectboxes as NodeListOf<HTMLElement>) {
      const name = item.querySelector('select')?.name || Math.random().toString(36).substring(2, 15);
      selectboxList[name] = loadSelectbox(item, {
        onSelect(value) {
          const input = item.parentElement?.closest('.zotlo-checkout__input')?.querySelector('input[data-mask]') as HTMLInputElement;
          if (input && Object.prototype.hasOwnProperty.call(input.dataset, 'phone')) {
            updatePhoneMask(value, input);
          }
        }
      });
    }

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

          if (FORM_ITEMS.SUBSCRIBER_ID_PHONE.input.name === item.name) {
            // Update for initial value
            maskItems[item.name].updateValue();
          }
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

  function unmount() {
    const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
    formElement?.removeEventListener('submit', handleForm);

    for (const mask of Object.values(maskItems)) {
      mask.destroy();
    }

    for (const item of Object.values(validations)) {
      item.destroy();
    }

    for (const item of Object.values(selectboxList)) {
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
    unmount
  }
}

export { ZotloCheckout }
