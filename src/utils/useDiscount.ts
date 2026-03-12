import { type FormConfig, type IZotloCheckoutParams } from "../lib/types";
import {
  setFormDisabled,
  useI18n,
  ZOTLO_GLOBAL,
  getIsDiscountCodeApplied
} from "../utils";
import { createDiscountInput, createAppliedDiscountSection } from "../lib/create";
import { CheckoutAPI } from "../utils/api";
import { Logger } from '../lib/logger';

export function useDiscount(payload: { params: IZotloCheckoutParams; config: FormConfig, syncAllPrices: () => Promise<void> }) {
  const { params, config, syncAllPrices } = payload;
  const isMobileAppTheme = config.design.theme === 'mobileapp';
  const tabList = isMobileAppTheme ? [ZOTLO_GLOBAL.formElement] : ZOTLO_GLOBAL.container?.querySelectorAll('[data-tab-content]');
  const activeTab = isMobileAppTheme ? ZOTLO_GLOBAL.formElement : ZOTLO_GLOBAL.container?.querySelector('[data-tab-active="true"]');
  const isPanelEditMode = import.meta.env.VITE_CONSOLE;

  const destroyList = {
    discounted: null as (() => void) | null,
    undiscounted: null as (() => void) | null,
  }

  const isDiscountCodeEntryEnabled = !!config.settings?.enableDiscountCodeEntry;
  if (!isDiscountCodeEntryEnabled) return destroyList;

  const { $t } = useI18n(config.general.localization);
  const isDiscountCodeApplied = getIsDiscountCodeApplied(config);

  function validateDiscountCode(code: string): boolean {
    const regex = /^[a-zA-Z0-9]{3,15}$/;
    return regex.test(code);
  }

  function setDiscountErrorMessage(message: string = "") {
    const errorMessageAll = ZOTLO_GLOBAL.container?.querySelectorAll('[data-discount-error]') as NodeListOf<HTMLElement>;

    errorMessageAll?.forEach((errorMessage) => {
      errorMessage.innerText = message;
    });
  }

  function setLoadingForDiscount(isLoading = true, actionAfterLoading = "apply") {
    tabList?.forEach((tab) => {
      const actionButton = tab?.querySelector('[data-discount-action]') as HTMLButtonElement;
      const discountAppliedSection = tab?.querySelector('.zotlo-checkout__discount-content__discount-applied') as HTMLElement;
  
      if (isLoading) {
        setFormDisabled();
        actionButton?.setAttribute('disabled', 'true');
        actionButton?.setAttribute('data-discount-action', 'loading');
        discountAppliedSection?.setAttribute('data-loading', 'true');
      } else {
        setFormDisabled(false);
        actionButton?.removeAttribute('disabled');
        discountAppliedSection?.removeAttribute('data-loading');
        actionButton?.setAttribute('data-discount-action', actionAfterLoading);
      }
    });
  }

  function loadUndiscountedState() {
    const toggleButton = activeTab?.querySelector('[data-discount-toggle]') as HTMLButtonElement;
    const discountCodeInput = activeTab?.querySelector('input[name="discountCode"]') as HTMLInputElement;
    const actionButton = activeTab?.querySelector('[data-discount-action]') as HTMLButtonElement;

    async function applyDiscount() {
      const discountCode = ZOTLO_GLOBAL.data.discountCode;
      if (!validateDiscountCode(discountCode)) {
        setDiscountErrorMessage($t('form.discount.validationWithMinMax', { min: 3, max: 15 }));
        return;
      }
      setDiscountErrorMessage();

      if (isPanelEditMode) return destroyList;
      try {
        setLoadingForDiscount(true);
        const response = await CheckoutAPI.post('/payment/apply-discount', { discountCode });
        if (response?.meta?.errorCode) {
          setDiscountErrorMessage(response.meta.message);
          params.events?.onFail?.({ message: response?.meta?.message, data: response?.meta })
          setLoadingForDiscount(false);
          return;
        }
      } catch (e) {
        Logger.client?.captureException(e);
        setLoadingForDiscount(false);
      }

      destroyList.undiscounted?.();
      destroyList.undiscounted = null;

      await syncAllPrices();

      for (const tab of tabList || []) {
        const section = tab?.querySelector('[data-discount-section]') as HTMLElement;
        if (section) section.innerHTML = createAppliedDiscountSection({ config });
      }

      ZOTLO_GLOBAL.data.discountCode = '';
      setLoadingForDiscount(false);
      discountCodeInput?.focus();
      destroyList.discounted = loadDiscountedState();
    }

    function cancelDiscount() {
      tabList?.forEach((tab) => {
        const input = tab?.querySelector('input[name="discountCode"]') as HTMLInputElement;
        if (input) input.value = '';
        tab?.querySelector('[data-discount-content]')?.setAttribute('data-discount-content', 'false');
        setDiscountErrorMessage();
      });

      ZOTLO_GLOBAL.data.discountCode = '';
    }

    function onClickToggle() {
      tabList?.forEach((tab) => {
        const content = tab?.querySelector('[data-discount-content]');
        const isActive = content?.getAttribute('data-discount-content') === 'true';
        content?.setAttribute('data-discount-content', isActive ? 'false' : 'true');
        if (!isActive) discountCodeInput?.focus();
      })
    }

    function onKeyUpDiscountCode(e: KeyboardEvent) {
      if (e.key === 'Enter') return applyDiscount();
    }

    function onInput(e: Event) {
      const value = (e.target as HTMLInputElement)?.value?.trim().toUpperCase() || '';
      ZOTLO_GLOBAL.data.discountCode = value;
      (e.target as HTMLInputElement).value = value;
      tabList?.forEach((tab) => {
        const actionButton = tab?.querySelector('[data-discount-action]') as HTMLButtonElement;
        const actionButtonSpan = actionButton?.querySelector('[data-discount-action-span]') as HTMLSpanElement;
    
        if (value) {
          if (actionButtonSpan) actionButtonSpan.innerText = $t('common.apply');
          actionButton?.setAttribute('data-discount-action', 'apply');
        } else {
          if (actionButtonSpan) actionButtonSpan.innerText = $t('common.cancel');
          actionButton?.setAttribute('data-discount-action', 'cancel');
        }
      });
    }

    function onKeyDownDiscountCode(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onClickAction() {
      const actionName = actionButton.getAttribute('data-discount-action');
      if (actionName === 'apply') {
        applyDiscount();
      } else {
        cancelDiscount();
      }
    }

    toggleButton?.addEventListener('click', onClickToggle);
    discountCodeInput?.addEventListener('keydown', onKeyDownDiscountCode);
    discountCodeInput?.addEventListener('keyup', onKeyUpDiscountCode);
    discountCodeInput?.addEventListener('input', onInput);
    actionButton?.addEventListener('click', onClickAction);

    return function destroy() {
      toggleButton?.removeEventListener('click', onClickToggle);
      discountCodeInput?.removeEventListener('keydown', onKeyDownDiscountCode);
      discountCodeInput?.removeEventListener('keyup', onKeyUpDiscountCode);
      discountCodeInput?.removeEventListener('input', onInput);
      actionButton?.removeEventListener('click', onClickAction);
    }
  }

  function loadDiscountedState() {
    const removeDiscountButton = activeTab?.querySelector('[data-discount-remove]') as HTMLButtonElement;

    async function onClickRemoveDiscount() {
      if (isPanelEditMode) return destroyList;
      try {
        setLoadingForDiscount(true);
        const response = await CheckoutAPI.post('/payment/apply-discount', { remove: true });
        if (response?.meta?.errorCode) {
          setDiscountErrorMessage(response.meta.message);
          params.events?.onFail?.({ message: response?.meta?.message, data: response?.meta })
          setLoadingForDiscount(false);
          return;
        }
      } catch (e) {
        Logger.client?.captureException(e);
        setLoadingForDiscount(false);
      }

      destroyList.discounted?.();
      destroyList.discounted = null;

      await syncAllPrices();

      for (const tab of tabList || []) {
        const section = tab?.querySelector('[data-discount-section]') as HTMLElement;
        if (section) section.innerHTML = createDiscountInput({ config });
      }

      setLoadingForDiscount(false, "cancel");

      destroyList.undiscounted = loadUndiscountedState();
    }

    removeDiscountButton.addEventListener('click', onClickRemoveDiscount);

    return function destroy() {
      removeDiscountButton?.removeEventListener('click', onClickRemoveDiscount);
    }
  }

  if (isDiscountCodeApplied) {
    destroyList.discounted = loadDiscountedState();
  } else {
    destroyList.undiscounted = loadUndiscountedState();
  }

  return destroyList;
}