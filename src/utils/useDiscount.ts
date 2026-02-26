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
  const discountSection = ZOTLO_GLOBAL.container?.querySelector('[discount-section]') as HTMLElement;

  const destroyList = {
    discounted: null as (() => void) | null,
    undiscounted: null as (() => void) | null,
  }

  const isDiscountCodeEntryEnabled = !!config.settings.enableDiscountCodeEntry;
  if (!isDiscountCodeEntryEnabled) return destroyList;

  const { $t } = useI18n(config.general.localization);
  const isDiscountCodeApplied = getIsDiscountCodeApplied(config);

  function validateDiscountCode(code: string): boolean {
    const regex = /^[a-zA-Z0-9]{3,15}$/;
    return regex.test(code);
  }

  function setDiscountErrorMessage(message: string = "") {
    const errorMessage = ZOTLO_GLOBAL.container?.querySelector('[data-discount-error]') as HTMLElement;
    errorMessage.innerText = message;
  }

  function setLoadingForDiscount(isLoading = true, actionAfterLoading = "apply") {
    const actionButton = ZOTLO_GLOBAL.container?.querySelector('[data-discount-action]') as HTMLButtonElement;
    const discountAppliedSection = ZOTLO_GLOBAL.container?.querySelector('.zotlo-checkout__discount-content__discount-applied') as HTMLElement;

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
  }

  function loadUndiscountedState() {
    const discountContent = ZOTLO_GLOBAL.container?.querySelector('[data-discount-content]') as HTMLElement;
    const toggleButton = ZOTLO_GLOBAL.container?.querySelector('[data-discount-toggle]') as HTMLButtonElement;
    const discountCodeInput = ZOTLO_GLOBAL.container?.querySelector('input[name="discountCode"]') as HTMLInputElement;
    const actionButton = ZOTLO_GLOBAL.container?.querySelector('[data-discount-action]') as HTMLButtonElement;
    const actionButtonSpan = actionButton?.querySelector('[data-discount-action-span]') as HTMLSpanElement;

    async function applyDiscount() {
      const discountCode = discountCodeInput.value || '';
      if (!validateDiscountCode(discountCode)) {
        setDiscountErrorMessage($t('form.discount.validationWithMinMax', { min: 3, max: 15 }));
        return;
      }
      setDiscountErrorMessage();
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

      discountSection.innerHTML = createAppliedDiscountSection({ config });
      setLoadingForDiscount(false);
      discountCodeInput?.focus();
      destroyList.discounted = loadDiscountedState();
    }

    function cancelDiscount() {
      discountCodeInput.value = '';
      discountContent?.setAttribute('data-discount-content', 'false');
      setDiscountErrorMessage();
    }

    function onClickToggle() {
      const isActive = discountContent?.getAttribute('data-discount-content') === 'true';
      discountContent?.setAttribute('data-discount-content', isActive ? 'false' : 'true');
      if (!isActive) discountCodeInput?.focus();
    }

    function onKeyUpDiscountCode(e: KeyboardEvent) {
      const value = (e.target as HTMLInputElement)?.value?.trim() || '';
      if (e.key === 'Enter') return applyDiscount();
      if (value) {
        actionButtonSpan.innerText = $t('common.apply');
        actionButton?.setAttribute('data-discount-action', 'apply');
      } else {
        actionButtonSpan.innerText = $t('common.cancel');
        actionButton?.setAttribute('data-discount-action', 'cancel');
      }
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
    actionButton?.addEventListener('click', onClickAction);

    return function destroy() {
      toggleButton?.removeEventListener('click', onClickToggle);
      discountCodeInput?.removeEventListener('keydown', onKeyDownDiscountCode);
      discountCodeInput?.removeEventListener('keyup', onKeyUpDiscountCode);
      actionButton?.removeEventListener('click', onClickAction);
    }
  }

  function loadDiscountedState() {
    const removeDiscountButton = ZOTLO_GLOBAL.container?.querySelector('[data-discount-remove]') as HTMLButtonElement;

    async function onClickRemoveDiscount() {
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

      discountSection.innerHTML = createDiscountInput({ config });
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