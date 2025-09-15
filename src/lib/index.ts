import { DesignTheme, PaymentProvider, type FormConfig, type IZotloCheckoutParams, type IZotloCheckoutReturn, type ProviderConfigs } from "./types"
import { generateEmptyPage, generateTheme } from "./theme";
import { IMaskInputOnInput, maskInput } from "../utils/inputMask";
import { validateInput, type ValidationResult, updateValidationMessages, validatorInstance } from "../utils/validation";
import { FORM_ITEMS } from "./fields";
import { getCardMask } from "../utils/getCardMask";
import { getCDNUrl } from "../utils/getCDNUrl";
import { createStyle } from "../utils/createStyle";
import { loadFontsOnPage } from "../utils/fonts";
import {
  getCountryByCode,
  getMaskByCode,
  preparePaymentMethods,
  setFormLoading,
  setFormDisabled,
  debounce,
  handleSubscriberIdInputEventListeners,
  activateDisabledSubscriberIdInputs,
  useI18n,
  handlePriceChangesBySubscriptionStatus,
  syncSubscriberIdInputs
} from "../utils";
import { getConfig, getPaymentData, ErrorHandler } from "../utils/getConfig";
import { getPackageInfo } from "../utils/getPackageInfo";
import { sendPayment, registerPaymentUser } from "../utils/sendPayment";
import { handleUrlQuery } from "../utils/handleUrlQuery";
import { prepareProviders, renderGooglePayButton } from "../utils/loadProviderSdks";
import { createAgreementModal, createPaymentSuccessForm } from "./create";
import { ErrorCode } from "./errors";

async function ZotloCheckout(params: IZotloCheckoutParams): Promise<IZotloCheckoutReturn> {
  let config = { general: {}, settings: {}, design: {}, success: {}, providerConfigs: {} } as FormConfig;

  if (import.meta.env.VITE_SDK_API_URL) {
    config = await getConfig({ 
      token: params.token,
      packageId: params.packageId,
      language: params.language,
      subscriberId: params.subscriberId,
      returnUrl: params.returnUrl,
      style: params.style
    });
    await refreshProviderConfigs();
  }

  let containerId = '';
  const maskItems: Record<string, ReturnType<typeof maskInput>> = {};
  const validations: Record<string, ReturnType<typeof validateInput>> = {};
  const selectboxList: Record<string, ReturnType<typeof loadSelectbox>> = {};
  let destroyAgreementLinks = null as (() => void) | null;

  async function refreshProviderConfigs() {
    config.providerConfigs = await prepareProviders(config, params?.returnUrl || '') as ProviderConfigs;
  }

  async function refreshPaymentInitData() {
    const paymentInitData = await getPaymentData();
    config.paymentData = paymentInitData;
    config.packageInfo = getPackageInfo(config);
  }

  function getFormValues(form: HTMLFormElement) {
    const payload: Partial<Record<string, any>> = {};
    const activeForm = config.design.theme === DesignTheme.HORIZONTAL
      ? form.querySelector('[data-tab-active="true"]')?.querySelectorAll('input, select') as NodeListOf<HTMLInputElement>
      : form.elements;

    if (!activeForm) return payload;

    for (const item of activeForm as NodeListOf<HTMLInputElement>) {
      const name = item?.name;
      if (name) {
        payload[name] = item?.type === 'checkbox' ? !!item?.checked : item?.value || '';
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

  function validateForm(providerKey: PaymentProvider) {
    const errors = [];
    const bypassProtectedFields = [
      FORM_ITEMS.SUBSCRIBER_ID_EMAIL.input.name,
      FORM_ITEMS.AGREEMENT_CHECKBOX.input.name
    ]

    for (const validation of Object.values(validations)) {
      const name = validation.name;
      const bypass = providerKey !== PaymentProvider.CREDIT_CARD ? !bypassProtectedFields.includes(name) : false;

      const result = validation.validate(bypass);
      if (!result.isValid) {
        errors.push({ name, result });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  function getContainerElement() {
    if (!containerId) return null;
    return document.getElementById(containerId);
  }

  async function handleFormSubmit(providerKey: PaymentProvider = PaymentProvider.CREDIT_CARD) {
    // Reset form validations
    for (const validation of Object.values(validations)) {
      validation.validate(true);
    }

    const validation = validateForm(providerKey);
    
    if (!validation.isValid) return;
    
    if (import.meta.env.VITE_SDK_API_URL) {
      const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
      const result = getFormValues(formElement);
      params.events?.onSubmit?.(result);

      try {
        setFormLoading(true);
        await sendPayment({
          providerKey,
          formData: { packageId: params.packageId, ...result },
          params,
          config,
          containerId,
          refreshProviderConfigsFunction: refreshProviderConfigs
        });
      } finally {
        setFormLoading(false);
      }
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

  async function onClickSubmitButton(this: HTMLButtonElement, e: PointerEvent | MouseEvent) {
    const isMouseClick = (e as PointerEvent)?.pointerId !== -1;
    const providerKey = isMouseClick || config.design.theme === DesignTheme.HORIZONTAL
    ? this.dataset.provider as PaymentProvider // Provider by click
    : detectAndValidateForm(); // Detect provider where input is focused

    return handleFormSubmit(providerKey);
  }

  function hasAnyConfig() {
    return Object.keys(config.settings).length > 0;
  }

  function handleAgreementLinks() {
    const container = getContainerElement()?.querySelector('form');
    const buttons = container?.querySelectorAll('[data-agreement]') as NodeListOf<HTMLButtonElement>;    

    function closeAgreement() {
      container?.querySelector('[data-modal="agreement"]')?.remove();
    }

    function handleClick(this: HTMLElement) {
      const target = this as HTMLElement;
      const agreement = target.getAttribute('data-agreement') as any;
      const modalHTML = createAgreementModal({ key: agreement, config })
      const parser = new DOMParser();
      let modalDOM = parser.parseFromString(modalHTML, 'text/html')?.body.firstChild as HTMLElement;

      // Add modal close action
      modalDOM?.querySelector('[data-modal-close]')?.addEventListener('click', handleClose);

      container?.insertBefore(modalDOM, container.firstChild as HTMLElement);
      modalDOM = container?.querySelector(`[data-modal="agreement"]`) as HTMLElement;

      setTimeout(() => {
        modalDOM?.classList.remove('zotlo-checkout__modal-enter-from');
        modalDOM?.classList.remove('zotlo-checkout__modal-enter-active');
      }, 0)

      function handleClose(this: HTMLElement) {
        const closeBtn = this as HTMLElement;
        modalDOM?.classList.add('zotlo-checkout__modal-enter-from');
        modalDOM?.classList.add('zotlo-checkout__modal-enter-active');
        closeBtn.removeEventListener('click', handleClose);
        
        setTimeout(() => closeAgreement(), 150);
      }
    }

    if (buttons?.length > 0) {
      for (const button of buttons) {
        button.addEventListener('click', handleClick);
      }
    }

    function destroy() {
      closeAgreement();
      if (!buttons || buttons?.length === 0) return;

      for (const button of buttons) {
        button.removeEventListener('click', handleClick);
      }
    }

    return {
      destroy
    }
  }

  function handleTabView() {
    if (!hasAnyConfig()) return;

    const paymentMethods = preparePaymentMethods(config);

    if (
      config.design.theme === DesignTheme.VERTICAL ||
      paymentMethods.length < 2 && config.design.theme === DesignTheme.HORIZONTAL ||
      paymentMethods.length <= 2 && config.design.theme === DesignTheme.MOBILEAPP
    ) {
      initFormInputs();
      return;
    }

    const tabItems = document.querySelectorAll('.zotlo-checkout button[data-tab]');
    const tabContents = document.querySelectorAll('.zotlo-checkout [data-tab-content]');
    const tabSubscriberIdContent = document.querySelector('.zotlo-checkout [data-tab-content="subscriberId"]');

    function handleTabClick(e: Event) {
      const target = e.target as HTMLElement;
      const tabName = target.getAttribute('data-tab');
      const tabContent =  document.querySelector(`.zotlo-checkout [data-tab-content="${tabName}"]`) as HTMLElement;

      if (tabContent) {
        destroyFormInputs();

        for (const item of tabItems) {
          item.setAttribute('data-active', 'false');
        }

        for (const item of tabContents) {
          item.setAttribute('data-tab-active', 'false');
          if (config.design.theme === DesignTheme.HORIZONTAL) {
            item.querySelector('button[data-provider]')?.setAttribute('type', 'button')
          }
        }

        target.setAttribute('data-active', 'true');
        tabContent.setAttribute('data-tab-active', 'true');

        if (config.design.theme === DesignTheme.HORIZONTAL) {
          tabContent.querySelector('button[data-provider]')?.setAttribute('type', 'submit')
        }

        if (tabName !== PaymentProvider.CREDIT_CARD) {
          tabSubscriberIdContent?.setAttribute('data-tab-active', 'true');
        } else {
          tabSubscriberIdContent?.setAttribute('data-tab-active', 'false');
        }
        syncSubscriberIdInputs(tabName);
        initFormInputs();
      }
    }

    for (const item of tabItems) {
      item.addEventListener('click', handleTabClick);
    }

    tabItems.item(0)?.dispatchEvent(new Event('click'));
  }

  async function refresh() {
    if (!containerId) return;

    if (import.meta.env.VITE_CONSOLE) {
      if ((globalThis as any)?.getZotloConfig) {
        config = await (globalThis as any)?.getZotloConfig?.() as FormConfig;
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

    if (import.meta.env.VITE_SDK_API_URL) {
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
  }

  function loadSelectbox(item: HTMLElement, options: {
    onSelect: (value: string) => void;
  }) {
    if (item.getAttribute('disabled') === 'true') {
      return {};
    }

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
        (item.querySelector('[data-select-list] [data-selected="true"]') as HTMLElement)?.focus();
      }
    }

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSelectbox();
      }
    }

    function handleItemKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = item.querySelector('[data-select-list] [data-selected]:focus');
        if (activeItem) selectItem.bind(activeItem as HTMLElement)();
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
      toggle?.addEventListener('keydown', handleKeydown);

      for (const item of items) {
        item.addEventListener('click', selectItem);
        item.addEventListener('keydown', handleItemKeydown);
      }
    }

    function destroy() {
      toggle?.removeEventListener('click', toggleSelectbox);
      toggle?.removeEventListener('keydown', handleKeydown);
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

  const onSubscriberIdEntered = debounce(async (event: InputEvent) => {
    if (!import.meta.env.VITE_SDK_API_URL || !config.packageInfo?.isProviderRefreshNecessary) return;
    const subscriberInput = event?.target as HTMLInputElement;
    const subscriberId = subscriberInput?.value || '';
    const validationRules = subscriberInput?.dataset?.rules || '';
    const isValidSubscriberId = validatorInstance?.validate(subscriberId, validationRules)?.isValid;
    if (!isValidSubscriberId) return;
    try {
      setFormDisabled();
      const response = await registerPaymentUser(subscriberId, config, params);
      if (response?.meta?.errorCode === ErrorCode.USER_ALREADY_SUBSCRIBED_ERROR) {
        activateDisabledSubscriberIdInputs();
        subscriberInput.focus();
        return;
      }
      await Promise.all([refreshPaymentInitData(), refreshProviderConfigs()]);
      handlePriceChangesBySubscriptionStatus(config);
      setFormDisabled(false);
      subscriberInput.focus();
    } catch {
      setFormDisabled(false);
    }
  }, 500)

  function initFormInputs() {
    const wrapper = config.design.theme !== DesignTheme.MOBILEAPP ? '[data-tab-active="true"] ' : '';
    const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
    const maskInputs = formElement?.querySelectorAll(wrapper + 'input[data-mask]');
    const ruleInputs = formElement?.querySelectorAll(wrapper + 'input[data-rules]');
    const selectboxes = getContainerElement()?.querySelectorAll(wrapper + '[data-select]');

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

    if (import.meta.env.VITE_SDK_API_URL) {
      const { destroy } = handleAgreementLinks();
      destroyAgreementLinks = destroy;
      renderGooglePayButton(config);
    }

    const submitButtons = getContainerElement()?.querySelectorAll('button[data-provider]');

    if (submitButtons) {
      for (let i = 0; i < submitButtons?.length; i++) {
        const submit = submitButtons.item(i) as HTMLButtonElement;
        submit.addEventListener('click', onClickSubmitButton, { passive: true });
      }
    }

    formElement?.addEventListener('submit', handleForm);
    handleSubscriberIdInputEventListeners('add', onSubscriberIdEntered);
  }

  function destroyFormInputs() {
    const formElement = document.getElementById('zotlo-checkout-form') as HTMLFormElement;
    const submitButtons = getContainerElement()?.querySelectorAll('button[data-provider]');

    if (submitButtons) {
      for (let i = 0; i < submitButtons?.length; i++) {
        const submit = submitButtons.item(i) as HTMLButtonElement;
        submit.removeEventListener('click', onClickSubmitButton);
      }
    }

    formElement?.removeEventListener('submit', handleForm);
    handleSubscriberIdInputEventListeners('remove', onSubscriberIdEntered);

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
    destroyAgreementLinks?.();
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
          class="!text-white underline"
        >${$t('cookiePopup.word.cookiePolicy')}</a>`,
      })
    });
    handleUrlQuery({
      params,
      config,
      containerId
    });
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
    refresh,
    unmount
  }
}

export { ZotloCheckout }
