import { createCreditCardForm, createProviderButton } from "../../create";
import { FormConfig, FormSetting, PaymentProvider } from "../../types";

export function prepareProvider(params: {
  config: FormConfig;
  paymentMethods: FormSetting['paymentMethodSetting'];
  method: FormSetting['paymentMethodSetting'][number];
  index: number;
  tabAvailable?: boolean;
}) {
  const { config, paymentMethods, method, index, tabAvailable } = params;

  if (method?.providerKey !== PaymentProvider.CREDIT_CARD) {
    return createProviderButton({
      provider: method?.providerKey,
      config,
      tabAvailable: !!index
    });
  }

  if (method?.providerKey === PaymentProvider.CREDIT_CARD) {
    const isFirstItem = index === 0;
    const isLastItem = index === paymentMethods.length - 1;
    const isOnlyItem = paymentMethods.length === 1;
    const isMiddleItem = !isFirstItem && !isLastItem;
    let seperator = undefined as undefined | 'top' | 'bottom' | 'both';

    if (!isOnlyItem && !isFirstItem && isMiddleItem) {
      seperator = 'both';
    } else if (!isOnlyItem && isFirstItem) {
      seperator = 'bottom';
    } else if (!isOnlyItem && isLastItem) {
      seperator = 'top';
    }

    return createCreditCardForm({
      ...params,
      formType: index === 0 ? 'both' : 'creditCard',
      seperator,
      className: 'zotlo-checkout__payment-provider',
      attrs: tabAvailable ?  { 'data-tab-content': PaymentProvider.CREDIT_CARD, 'data-tab-active': 'true' } : {},
      showPrice: false
    });
  }
}
