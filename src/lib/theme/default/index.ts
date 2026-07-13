import mainHTML from './html/main.html?raw'
import { type FormSetting, PaymentProvider, type FormConfig, DesignTheme, type FooterInfo } from '../../types'
import { generateAttributes, generateTabButtons } from '../../../utils'
import { template } from "../../../utils/template";
import { createCreditCardForm, createProviderButton, createPaymentHeader, createFooter, createPriceTable } from '../../create'

export function generateThemeDefault(params: {
  config: FormConfig;
  dir: 'rtl' | 'ltr';
  themePreference: 'dark' | 'light';
  paymentMethods: FormSetting['paymentMethodSetting'];
  footerInfo: FooterInfo;
}) {
  const { config, dir, themePreference, paymentMethods, footerInfo } = params;
  const isTabTheme = !config.cardUpdate && config.design.theme === DesignTheme.HORIZONTAL && paymentMethods.length > 1;
  let providerButtons = paymentMethods.map((method, index) => {
    if (method.providerKey !== PaymentProvider.CREDIT_CARD) {
      return createProviderButton({
        provider: method.providerKey,
        config,
        tabAvailable: true
      });
    }

    if (method.providerKey === PaymentProvider.CREDIT_CARD) {
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
        formType: isFirstItem || isTabTheme ? 'both' : 'creditCard',
        seperator,
        className: 'zotlo-checkout__payment-provider',
        attrs: { 'data-tab-content': PaymentProvider.CREDIT_CARD, 'data-tab-active': 'true' },
        showPrice: isFirstItem || isTabTheme
      });
    }
  }).join('');

  if (paymentMethods?.[0]?.providerKey !== PaymentProvider.CREDIT_CARD || isTabTheme) {
    providerButtons = createCreditCardForm({
      ...params,
      formType: 'subscriberId',
      className: 'zotlo-checkout__payment-provider',
      attrs: {
        'data-tab-content': 'subscriberId',
        'data-tab-active': 'true'
      },
      showPrice: true
    }) + providerButtons;
  }

  const tabButtons = isTabTheme ? generateTabButtons(config, paymentMethods) : '';

  const paymentHeader = createPaymentHeader({ config });
  const footer = createFooter(footerInfo) || '';
  let priceTable = '';

  if (config.general.canViewPriceTable) {
    priceTable = createPriceTable({ config }) || '';
  }

  return template(mainHTML, {
    DIR: dir,
    DARK_MODE: themePreference,
    THEME: config.design.theme === DesignTheme.HORIZONTAL && paymentMethods.length > 1
      ? DesignTheme.HORIZONTAL
      : DesignTheme.VERTICAL,
    HEADER: paymentHeader || '',
    PRICE_TABLE: priceTable,
    TAB_BUTTONS: tabButtons,
    PROVIDERS: providerButtons,
    FOOTER: footer,
    ATTRIBUTES: generateAttributes({
      autocomplete: 'off',
      ...(config.cardUpdate ? {'data-type': 'card'} : {})
    })
  });
}
