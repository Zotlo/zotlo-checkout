import { CardAPI } from "../utils/api";
import { ErrorHandler, getCardConfig } from "../utils/config";
import { IMaskInputOnInput, maskInput } from "../utils/inputMask";
import { validateInput, ValidationResult, validatorInstance } from "../utils/validation";
import { Logger } from './logger';
import { DesignTheme, PaymentProvider, type FormConfig, type IZotloCardParams } from './types';
import { getFormValues, loadSelectbox } from "./common";
import { updateValidationMessages } from "../utils/validation";
import { loadFontsOnPage } from "../utils/fonts";
import { generateEmptyPage, generateTheme } from "./theme";
import { createStyle } from "../utils/createStyle";
import { createPaymentSuccessForm } from "./create";
import { activateDisabledSubscriberIdInputs, debounce, getCDNUrl, getCountryByCode, getIsSavedCardPayment, getMaskByCode, handlePriceChangesBySubscriptionStatus, handleSubscriberIdInputEventListeners, mergeDeep, setFormDisabled, setFormLoading, useI18n } from "../utils";
import { handleUrlQuery } from "../utils/handleUrlQuery";
import { EventBus } from "../utils/eventBus";
import { getCardMask } from "../utils/getCardMask";
import { FORM_ITEMS } from "./fields";
import { registerPaymentUser } from "../utils/sendPayment";
import { updateCard } from "../utils/updateCard";

async function ZotloCard(params: IZotloCardParams) {
  // Load Sentry for error tracking
  await Logger.loadSentry();

  // Get configuration from ZotloCheckout if available
  const [configFromCheckout] = EventBus.emit('configZotloCheckout') as [FormConfig | undefined];

  let config = mergeDeep(
    { general: {}, settings: {}, design: {}, success: {}, providerConfigs: {} } as FormConfig,
    {...(configFromCheckout || {}), cardUpdate: true } as FormConfig,
    { ...(params?.style || {}) }
  ) as FormConfig;

  if (!configFromCheckout && import.meta.env.VITE_SDK_CARD_API_URL) {
    CardAPI.setUseCookie(!!params?.useCookie);
    config = await getCardConfig({
      token: params.token,
      packageId: params.packageId,
      language: params.language,
      subscriberId: params.subscriberId,
      returnUrl: params.returnUrl,
      style: params.style,
      customParameters: params.customParameters,
      useCookie: !!params?.useCookie,
      showSavedCards: params?.showSavedCards
    });
  }

  let containerId = '';
  const maskItems: Record<string, ReturnType<typeof maskInput>> = {};
  const validations: Record<string, ReturnType<typeof validateInput>> = {};
  const selectboxList: Record<string, ReturnType<typeof loadSelectbox>> = {};

  function hasAnyConfig() {
    return Object.keys(config.settings).length > 0;
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

  function getContainerElement() {
    if (!containerId) return null;
    return document.getElementById(containerId);
  }

  const onSubscriberIdEntered = debounce(async (event: InputEvent) => {
    if (!import.meta.env.VITE_SDK_CARD_API_URL || !config.packageInfo?.isProviderRefreshNecessary) return;
    const subscriberInput = event?.target as HTMLInputElement;
    const subscriberId = subscriberInput?.value || '';
    const validationRules = subscriberInput?.dataset?.rules || '';
    const isValidSubscriberId = validatorInstance?.validate(subscriberId, validationRules)?.isValid;
    if (!isValidSubscriberId) return;
    const container = getContainerElement() as HTMLElement;

    try {
      setFormDisabled.bind({ container })();
      const response = await registerPaymentUser(subscriberId, config, params);
      if (response?.meta?.errorCode) {
        activateDisabledSubscriberIdInputs(container);
        subscriberInput.focus();
        return;
      }
      handlePriceChangesBySubscriptionStatus.bind({ container }) (config);
      setFormDisabled.bind({ container })(false);
      subscriberInput.focus();
    } catch {
      setFormDisabled.bind({ container })(false);
    }
  }, 500);

  function handleTabView() {
    if (!hasAnyConfig()) return;
    initFormInputs();
  }

  function init() {
    handleTabView();
    const { $t } = useI18n(config.general.localization);
    params.events?.onLoad?.({
      sandbox: !!config?.paymentData?.sandboxPayment,
      countryCode: config.general.countryCode || '',
      integrations: config.integrations,
      backgroundColor: config.design.backgroundColor,
      cookieText: $t('cookiePopup.text', {
        cookiePolicy: `<a
          href="${config.general.zotloUrls?.cookiePolicy || '#'}"
          target="_blank"
        >${$t('cookiePopup.word.cookiePolicy')}</a>`,
      })
    });
    handleUrlQuery({
      params,
      config,
      containerId
    });
  }

  function validateForm(providerKey: PaymentProvider) {
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
      FORM_ITEMS.ZIP_CODE.input.name
    ];
    const isSavedCardPayment = getIsSavedCardPayment.bind({
      container: getContainerElement()
    })({ providerKey, config });

    for (const validation of Object.values(validations)) {
      const name = validation.name;
      const shouldSkipValidation = isSavedCardPayment 
        ? creditCardFields.includes(name) && providerKey === PaymentProvider.CREDIT_CARD
        : !sharedFields.includes(name) && providerKey !== PaymentProvider.CREDIT_CARD;

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

  function detectAndValidateForm() {
    const el = document.activeElement as HTMLInputElement;
    const container = getContainerElement();

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
        validateForm(providerKey);
        container?.querySelector('button[data-provider="' + providerKey + '"]')?.setAttribute('type', 'submit');
        return providerKey;
      }

      const name = el.name;

      // Credit card validation
      if (name.startsWith('card')) {
        validateForm(PaymentProvider.CREDIT_CARD);
        container?.querySelector('button[data-provider="creditCard"]')?.setAttribute('type', 'submit');
        return PaymentProvider.CREDIT_CARD;
      }
      
      const wrapper = el.closest('[data-form-type]');
      if (wrapper?.getAttribute('data-form-type') === 'subscriberId') {
        const button = wrapper.nextElementSibling?.querySelector('button[data-provider]') as HTMLButtonElement;

        if (button) {
          const providerKey = button.dataset.provider as PaymentProvider;
          validateForm(providerKey);
          button.setAttribute('type', 'submit');
          return providerKey;
        }
      }
    }

    return PaymentProvider.CREDIT_CARD;
  }

  async function handleForm(e: SubmitEvent) {
    e.preventDefault();
  }

  async function handleFormSubmit(providerKey: PaymentProvider = PaymentProvider.CREDIT_CARD) {
    // Reset form validations
    for (const validation of Object.values(validations)) {
      validation.validate(true);
    }

    const validation = validateForm(providerKey);
    
    if (!validation.isValid) return;

    const container = getContainerElement();
    
    if (import.meta.env.VITE_SDK_CARD_API_URL) {
      const formElement = container?.querySelector('form.zotlo-checkout') as HTMLFormElement;
      const result = getFormValues(formElement, config);
      params.events?.onSubmit?.();

      await updateCard({
        providerKey,
        formData: result,
        config,
        params
      });
      try {
        setFormLoading.bind({ container })(true);
      } catch (e) {
        Logger.client?.captureException(e);
      } finally {
        setFormLoading.bind({ container })(false);
      }
    }
  }

  async function onClickSubmitButton(this: HTMLButtonElement, e: PointerEvent | MouseEvent) {
    const isMouseClick = (e as PointerEvent)?.pointerId !== -1;
    const providerKey = isMouseClick || config.design.theme === DesignTheme.HORIZONTAL
      ? this.dataset.provider as PaymentProvider // Provider by click
      : detectAndValidateForm(); // Detect provider where input is focused

    return handleFormSubmit(providerKey);
  }

  function initFormInputs() {
    const wrapper = config.design.theme !== DesignTheme.MOBILEAPP ? '[data-tab-active="true"] ' : '';
    const container = getContainerElement() as HTMLElement;
    const formElement = container?.querySelector('form.zotlo-checkout') as HTMLFormElement;
    const maskInputs = formElement?.querySelectorAll(wrapper + 'input[data-mask]');
    const ruleInputs = formElement?.querySelectorAll(wrapper + 'input[data-rules]');
    const selectboxes = container?.querySelectorAll(wrapper + '[data-select]');

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
          rightSide.innerHTML = `<img src="${imgUrl}" alt="${currentMask.name}" class="zotlo-checkout__card-icon" />`
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

              if (!result.isValid) {
                params.events?.onInvalidForm?.({
                  name: item.name,
                  result
                });
              }
            }
          });
        }
      }
    }

    applyMaskAndValidation();

    const submitButtons = container?.querySelectorAll('button[data-provider]');

    if (submitButtons) {
      for (let i = 0; i < submitButtons?.length; i++) {
        const submit = submitButtons.item(i) as HTMLButtonElement;
        submit.addEventListener('click', onClickSubmitButton, { passive: true });
      }
    }
    
    formElement?.addEventListener('submit', handleForm);
    handleSubscriberIdInputEventListeners.bind({ container })('add', onSubscriberIdEntered);
  }

  function destroyFormInputs() {
    const container = getContainerElement() as HTMLElement;
    const formElement = container?.querySelector('form.zotlo-checkout') as HTMLFormElement;
    const submitButtons = container?.querySelectorAll('button[data-provider]');

    if (submitButtons) {
      for (let i = 0; i < submitButtons?.length; i++) {
        const submit = submitButtons.item(i) as HTMLButtonElement;
        submit.removeEventListener('click', onClickSubmitButton);
      }
    }

    formElement?.removeEventListener('submit', handleForm);
    handleSubscriberIdInputEventListeners.bind({ container })('remove', onSubscriberIdEntered);

    for (const [key, mask] of Object.entries(maskItems)) {
      mask.destroy();
      delete maskItems[key];
    }

    for (const item of Object.values(validations)) {
      item.destroy();
      delete validations[item.name];
    }

    for (const [key, item] of Object.entries(selectboxList)) {
      item?.destroy?.();
      delete selectboxList[key];
    }

    validatorInstance?.clearRules();
  }

  async function refresh() {
    try {
      if (!containerId) return;

      if (import.meta.env.VITE_CONSOLE) {
        if ((globalThis as any)?.getZotloConfig) {
          config = await (globalThis as any)?.getZotloConfig?.() as FormConfig;
          config.cardUpdate = true;
        }
      }

      if (hasAnyConfig()) {
        updateValidationMessages(config.general.localization.form.validation.rule);
        loadFontsOnPage([config.design.fontFamily]);
      }

      // Destroy everything before re-rendering
      unmount();

      let form = generateTheme({ config });
      const style = createStyle(config);
      const container = getContainerElement();

      if (import.meta.env.VITE_SDK_CARD_API_URL) {
        if (ErrorHandler.response) {
          form = generateEmptyPage({
            config,
            title: config?.general?.localization?.empty?.error?.title || 'An error occured',
            message: ErrorHandler.response?.meta?.message
          });
        }
      }

      if (container) container.innerHTML = `<style>${style}</style>` + form;

      init();

      if (import.meta.env.VITE_CONSOLE) {
        if ((config as any).render === 'after-payment')  {
          createPaymentSuccessForm({
            containerId,
            config,
            paymentDetail: (config as any).paymentDetail as any
          })
        }
      }
    } catch (err) {
      Logger.client?.captureException(err);
    }
  }

  function unmount() {
    destroyFormInputs();
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
    unmount,
    refresh
  }
}

export { ZotloCard }
