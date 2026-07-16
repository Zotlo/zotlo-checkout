import { DesignTheme, PaymentCallbackStatus, PaymentProvider, type FormConfig, type IZotloCheckoutParams, type IZotloCheckoutReturn, type ProviderConfigs } from "./types"
import { generateEmptyPage, generateTheme } from "./theme";
import { IMaskInputOnInput, maskInput } from "../utils/inputMask";
import { validateInput, updateValidationMessages, validatorInstance, checkboxValidation, inputValidation, validateForm, detectAndValidateForm } from "../utils/validation";
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
  handlePriceChanges,
  syncInputsOnTabs,
  handleSavedCardsEvents,
  getActiveSavedCardId,
  ZOTLO_GLOBAL,
  shouldSkipBillingFields,
  toggleCpfCnpjVisibility,
  isPixAvailable,
  isDLocalEnabled,
  getUserDataForIntegration
} from "../utils";
import { ErrorHandler } from "../utils/config";
import { getCheckoutConfig, getPaymentData } from "../utils/config/getCheckoutConfig";
import { getPackageInfo } from "../utils/getPackageInfo";
import { sendPayment, registerPaymentUser } from "../utils/sendPayment";
import { getPaymentCallback, handleUrlQuery, UrlQuery } from "../utils/handleUrlQuery";
import { prepareProviders, renderGooglePayButton } from "../utils/loadProviderSdks";
import { useDiscount } from "../utils/useDiscount";
import { createPaymentSuccessForm } from "./create";
import { CheckoutAPI } from "../utils/api";
import { Logger } from './logger';
import { getFormValues, loadSelectbox } from "./common";
import { ErrorCodes } from "../utils/config/types";

async function ZotloCheckout(params: IZotloCheckoutParams): Promise<IZotloCheckoutReturn> {
  // Load Sentry for error tracking
  await Logger.loadSentry();

  let config = { general: {}, settings: {}, design: {}, success: {}, providerConfigs: {} } as FormConfig;

  await reloadSession();

  const maskItems: Record<string, ReturnType<typeof maskInput>> = {};
  const validations: Record<string, ReturnType<typeof validateInput>> = {};
  const selectboxList: Record<string, ReturnType<typeof loadSelectbox>> = {};
  let destroySavedCardsEvents = null as (() => void) | null;
  let destroyBillingFormEvents = null as (() => void) | null;
  let destroyDiscountEvents = { discounted: null, undiscounted: null } as ReturnType<typeof useDiscount>;

  async function reloadSession() {
    config = { general: {}, settings: {}, design: {}, success: {}, providerConfigs: {} } as FormConfig;

    if (import.meta.env.VITE_SDK_API_URL) {
      CheckoutAPI.setUseCookie(!!params?.useCookie);
      config = await getCheckoutConfig({
        token: params.token,
        packageId: params.packageId,
        language: params.language,
        subscriberId: params.subscriberId,
        returnUrl: params.returnUrl,
        style: params.style,
        customParameters: params.customParameters,
        useCookie: !!params?.useCookie,
        showSavedCards: params?.showSavedCards,
        quantitySetting: params?.quantitySetting,
        enableDiscountCodeEntry: params?.enableDiscountCodeEntry
      });
      await refreshProviderConfigs();
    }
  }

  async function refreshProviderConfigs() {
    config.providerConfigs = await prepareProviders(config, params?.returnUrl || '') as ProviderConfigs;
  }

  async function refreshPaymentInitData() {
    const paymentInitData = await getPaymentData();
    config.paymentData = paymentInitData;
    config.packageInfo = getPackageInfo(config);
  }

  function getEventData() {
    const selectedPackage = config.paymentData?.package;
    const packageInfo = getPackageInfo(config, true);

    return {
      content_id: selectedPackage?.packageId,
      content_type: 'product',
      quantity: 1,
      description: config.general.appName,
      value: packageInfo.totalPayableAmount,
      currency: packageInfo.currency,
      contents: [{
        content_id: selectedPackage?.packageId,
        content_name: selectedPackage?.name,
        price: packageInfo.totalPayableAmount,
        quantity: 1
      }]
    };
  }

  async function handleFormSubmit(providerKey: PaymentProvider = PaymentProvider.CREDIT_CARD) {
    // Reset form validations
    for (const validation of Object.values(validations)) {
      validation.validate(true);
    }

    const skipBillingFields = shouldSkipBillingFields(config);
    const validation = validateForm({
      providerKey,
      config,
      validations,
      skipBillingFields
    });
    
    if (!validation.isValid) return;
    
    if (import.meta.env.VITE_SDK_API_URL) {
      const result = getFormValues(config);
      const cardId = getActiveSavedCardId({ providerKey, config });
      params.events?.onSubmit?.();

      getUserDataForIntegration({
        registerType: config.settings.registerType,
        subscriberId: result.subscriberId || config.general.subscriberId
      }).then(({ user_data: fbSiteData, context: tiktokContext }) => {
        window?.Facebook?.track('AddToCart', fbSiteData);
        window?.Tiktok?.track('AddToCart', {
          ...getEventData(),
          ...tiktokContext
        });
      }).catch(e => Logger.client?.captureException(e));

      try {
        setFormLoading(true);
        await sendPayment({
          providerKey,
          formData: {
            packageId: params.packageId, 
            ...result, 
            ...(cardId && { cardId }),
          },
          params,
          config,
          refreshProviderConfigsFunction: refreshProviderConfigs
        });
      } catch (e) {
        Logger.client?.captureException(e);
      } finally {
        setFormLoading(false);
      }
    }
  }

  async function handleForm(e: SubmitEvent) {
    e.preventDefault();
  }

  async function onClickSubmitButton(this: HTMLButtonElement, e: PointerEvent | MouseEvent) {
    const isMouseClick = (e as PointerEvent)?.pointerId !== -1;
    const providerKey = isMouseClick || config.design.theme === DesignTheme.HORIZONTAL
      ? this.dataset.provider as PaymentProvider // Provider by click
      : detectAndValidateForm({
          config,
          validations
        }); // Detect provider where input is focused

    return handleFormSubmit(providerKey);
  }

  function handleAutoFill(e: any) {
    // If the browser/1Password inserts a value, programmatically trigger validation
    if (!e.isTrusted) {
      validations?.[e.target.name]?.validate();
    }
  }

  function hasAnyConfig() {
    return Object.keys(config.settings).length > 0;
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
      try {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute('data-tab');
        const tabContent =  document.querySelector(`.zotlo-checkout [data-tab-content="${tabName}"]`) as HTMLElement;

        if (!tabContent) return;

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
        syncInputsOnTabs(tabName, ['subscriberId', 'discountCode']);
        initFormInputs();
      } catch (err) {
        Logger.client?.captureException(err);
      }
    }

    for (const item of tabItems) {
      item.addEventListener('click', handleTabClick);
    }

    tabItems.item(0)?.dispatchEvent(new Event('click'));
  }

  async function refresh() {
    try {
      if (!ZOTLO_GLOBAL.containerId) return;

      if (import.meta.env.VITE_CONSOLE) {
        if ((globalThis as any)?.getZotloConfig) {
          config = await (globalThis as any)?.getZotloConfig?.() as FormConfig;
        }
      }

      loadFontsOnPage([config.design.fontFamily]);

      if (hasAnyConfig()) {
        updateValidationMessages(config.general.localization.form.validation.rule);
      }

      // Destroy everything before re-rendering
      destroyFormInputs();

      let form = generateTheme({ config });
      const style = createStyle(config);
      const container = ZOTLO_GLOBAL.container;

      if (import.meta.env.VITE_SDK_API_URL) {
        const { success } = getPaymentCallback({ config });

        if (success && !config?.success?.show && config?.general?.isCheckoutLink) {
          form = `<form id="zotlo-checkout-form" class="zotlo-checkout" style="min-height: 230px">
            <div class="zotlo-checkout__form-loader"></div>
          </form>`;
        } else if (ErrorHandler.response) {
          let title = config?.general?.localization?.empty?.error?.title || 'An error occured';
          let message = ErrorHandler.response?.meta?.message;

          if (ErrorHandler.response?.meta.errorCode === ErrorCodes.NO_PROVIDER_AVAILABLE) {
            title = '';
            message = '';
          }

          form = generateEmptyPage({ config, title, message });
        }
      }

      if (container) container.innerHTML = `<style>${style}</style>` + form;

      init();

      if (import.meta.env.VITE_CONSOLE) {
        if ((config as any).render === 'after-payment')  {
          createPaymentSuccessForm({
            config,
            paymentDetail: (config as any).paymentDetail as any
          })
        }
      }
    } catch (err) {
      Logger.client?.captureException(err);
    }
  }

  async function syncAllPrices() {
    await refreshPaymentInitData();
    await refreshProviderConfigs();
    await handlePriceChanges(config);

    if (config.general.canViewPriceTable) {
      // Refresh discount events
      destroyDiscountEvents.discounted?.();
      destroyDiscountEvents.undiscounted?.();
      destroyDiscountEvents = useDiscount({ params, config, syncAllPrices });
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
      if (response?.meta?.errorCode) {
        activateDisabledSubscriberIdInputs();
        subscriberInput.focus();
        return;
      }
      await syncAllPrices();
      setFormDisabled(false);
      subscriberInput.focus();
    } catch {
      setFormDisabled(false);
    }
  }, 500);

  function handleBillingForm() {
    const formElement = ZOTLO_GLOBAL.formElement;
    const toggleName = FORM_ITEMS.BILLING_ACTIVATE.input.name;
    const tabContents = config.design.theme === DesignTheme.MOBILEAPP
      ? [formElement]
      : formElement?.querySelectorAll('[data-tab-content]');

    const destroyList: (() => void)[] = [];

    function handleOnTab(tabContent: HTMLElement) {
      const checkbox = tabContent?.querySelector(`input[name="${toggleName}"]`);
      const billingForm = tabContent?.querySelector('[data-billing-form]') as HTMLElement;

      function onChangeCheckbox(e: Event) {
        const isChecked = (e.target as HTMLInputElement).checked;
        billingForm?.setAttribute('data-billing-form', isChecked ? 'true' : 'false');
      }

      function destroyEvents() {
        checkbox?.removeEventListener('change', onChangeCheckbox);
      }

      checkbox?.addEventListener('change', onChangeCheckbox);

      return destroyEvents;
    }

    tabContents?.forEach((tabContent) => {
      destroyList.push(handleOnTab(tabContent as HTMLElement));
    });

    function destroy() {
      destroyList?.forEach((destroyFn) => destroyFn());
    }

    return destroy;
  }

  async function onFormInputChange() {
    const { user_data: fbSiteData, context: tiktokContext } = await getUserDataForIntegration({
      registerType: config.settings.registerType,
      subscriberId: config.general.subscriberId
    });

    // Send events to FB and Tiktok when user starts filling the form
    window?.Facebook?.track('AddPaymentInfo', {
      pageType: 'Payment',
      pageSlug: globalThis?.location?.pathname,
      ...fbSiteData
    });
    window?.Tiktok?.track('AddPaymentInfo', {
      pageType: 'Payment',
      pageSlug: globalThis?.location?.pathname,
      ...tiktokContext
    });

    // Bind AddPaymentInfo event to BE
    CheckoutAPI.post('/payment/eventInfo', {
      eventName: 'AddPaymentInfo',
      payload: {
        pageType: 'Payment',
        pageSlug: globalThis?.location?.pathname,
      }
    });

    const wrapper = config.design.theme !== DesignTheme.MOBILEAPP ? '[data-tab-active="true"] ' : '';
    const formElement = ZOTLO_GLOBAL.formElement;
    const formInputs = formElement?.querySelectorAll(wrapper + 'input');

    formInputs?.forEach((input) => {
      input.removeEventListener('change', onFormInputChange);
    });
  }

  async function onCookieConsentGranted(e: any) {
    const queryString = globalThis?.location?.search || "";
    const urlParams = new URLSearchParams(queryString);
    const queryParams = Object.fromEntries(urlParams?.entries());
    const hasConsent = !!e?.detail?.consent;

    if (
      hasConsent &&
      queryParams[UrlQuery.STATUS] === PaymentCallbackStatus.SUCCESS &&
      queryParams?.transactionId
    ) {
      return;
    }

    const { user_data: fbSiteData, context: tiktokContext } = await getUserDataForIntegration({
      registerType: config.settings.registerType,
      subscriberId: config.general.subscriberId
    });

    window?.Facebook?.track('InitiateCheckout', fbSiteData);
    window?.Tiktok?.track('InitiateCheckout', {
      ...getEventData(),
      ...tiktokContext
    });
  }

  async function sendCAPIInfo(e: any) {
    const data = e?.detail || {}
    const params = data?.params || {};
    const payload: Record<string, string> = {}

    if (data.integration === 'FB' && params.fbclid) {
      payload.fbclid = params.fbclid || '';
    }

    if (data.integration === 'TT' && params.ttclid) {
      payload.ttclid = params.ttclid || '';
    }

    if (Object.keys(payload).length === 0) return;

    // Bind to BE
    CheckoutAPI.post('/clickId', payload);
  }

  function initFormInputs() {
    const wrapper = config.design.theme !== DesignTheme.MOBILEAPP ? '[data-tab-active="true"] ' : '';
    const container = ZOTLO_GLOBAL.container;
    const formElement = ZOTLO_GLOBAL.formElement;
    const formInputs = formElement?.querySelectorAll(wrapper + 'input');
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

    function formatCpfCnpjMask(item: HTMLInputElement, options: IMaskInputOnInput) {
      const digits = options.value.replace(/\D/g, '').slice(0, 14);

      // The base mask (CNPJ) already formats 12-14 digit values correctly.
      if (digits.length > 11) return;

      // Apply the CPF pattern (###.###.###-##) for values up to 11 digits.
      let formatted = digits;
      if (digits.length > 9) {
        formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
      } else if (digits.length > 6) {
        formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      } else if (digits.length > 3) {
        formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
      }
      item.value = formatted;
    }

    function applyMaskAndValidation() {
      if (maskInputs) {
        for (const item of maskInputs as NodeListOf<HTMLInputElement>) {
          maskItems[item.name] = maskInput(item, {
            mask: item.getAttribute('data-mask') || '',
            onInput(payload) {
              if (payload.name === FORM_ITEMS.CARD_NUMBER.input.name) {
                formatCardMask(item, payload);
              } else if (payload.name === FORM_ITEMS.CPF_CNPJ.input.name) {
                formatCpfCnpjMask(item, payload);
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

              // Set state for subscriber ID and zip code
              if ([
                FORM_ITEMS.SUBSCRIBER_ID_EMAIL.input.name,
                FORM_ITEMS.SUBSCRIBER_ID_PHONE.input.name
              ].includes(item.name)) {
                ZOTLO_GLOBAL.data.subscriberId = item.value;
              }
            }
          });
        }
      }
    }

    applyMaskAndValidation();

    if (import.meta.env.VITE_SDK_API_URL) {
      const { destroy: destroyFn } = handleSavedCardsEvents({ config });
      destroySavedCardsEvents = destroyFn;
      renderGooglePayButton(config);
    }

    const submitButtons = container?.querySelectorAll('button[data-provider]');

    if (submitButtons) {
      for (let i = 0; i < submitButtons?.length; i++) {
        const submit = submitButtons.item(i) as HTMLButtonElement;
        submit.addEventListener('click', onClickSubmitButton, { passive: true });
      }
    }

    destroyBillingFormEvents = handleBillingForm();

    destroyDiscountEvents = useDiscount({ params, config, syncAllPrices });

    formElement?.addEventListener('submit', handleForm);
    formInputs?.forEach((input) => {
      input.addEventListener('change', handleAutoFill);
      input.addEventListener('change', onFormInputChange, { once: true });
    });
    document.addEventListener('cookieConsent', onCookieConsentGranted, { once: true });
    document.addEventListener('sendCAPIInfo', sendCAPIInfo);
    handleSubscriberIdInputEventListeners('add', onSubscriberIdEntered);

    // When dLocal is enabled the CPF/CNPJ field applies to every payment method,
    // so it stays visible regardless of the active tab. Otherwise it is only
    // relevant for PIX: in tabbed layouts show it while the PIX tab is active; in
    // tab-less layouts show it whenever PIX is available.
    const activeTab = container
      ?.querySelector('button[data-tab][data-active="true"]')
      ?.getAttribute('data-tab');

    const isCpfCnpjVisible = isDLocalEnabled(config)
      || (activeTab ? activeTab === PaymentProvider.PIX : isPixAvailable(config));
    toggleCpfCnpjVisibility(isCpfCnpjVisible);
  }

  function destroyFormInputs() {
    const container = ZOTLO_GLOBAL.container;
    const wrapper = config.design.theme !== DesignTheme.MOBILEAPP ? '[data-tab-active="true"] ' : '';
    const formElement = ZOTLO_GLOBAL.formElement;
    const formInputs = formElement?.querySelectorAll(wrapper + 'input');
    const submitButtons = container?.querySelectorAll('button[data-provider]');

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

    if (formInputs) {
      for (const input of formInputs as NodeListOf<HTMLInputElement>) {
        input.removeEventListener('change', handleAutoFill);
        input.removeEventListener('change', onFormInputChange);
      }
    }

    document.removeEventListener('cookieConsent', onCookieConsentGranted);
    document.removeEventListener('sendCAPIInfo', sendCAPIInfo);

    validatorInstance?.clearRules();
    destroySavedCardsEvents?.();
    destroyBillingFormEvents?.();

    destroyDiscountEvents.discounted?.();
    destroyDiscountEvents.undiscounted?.();
  }

  function init() {
    handleTabView();
    const { $t } = useI18n(config.general.localization);

    params.events?.onLoad?.({
      packageId: params.packageId,
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
  }

  function unmount() {
    destroyFormInputs();
    const container = ZOTLO_GLOBAL.container;
    if (container) container.innerHTML = '';
    ZOTLO_GLOBAL.reset();
  }

  function mount(id: string) {
    if (ZOTLO_GLOBAL.containerId) return;

    ZOTLO_GLOBAL.containerId = id;
    refresh();

    handleUrlQuery({
      params,
      config,
      reloadSession: async () => {
        await reloadSession();
        await refresh();
      }
    });
  }

  return {
    mount,
    refresh,
    unmount
  }
}

export { ZotloCheckout }
