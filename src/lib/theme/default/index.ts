import mainHTML from './html/main.html'
import { type FormSetting, PaymentProvider, type FormConfig } from '../../types'
import { template, useI18n, getCDNUrl, generateAttributes } from '../../../utils'
import { createButton, createCreditCardForm, createProviderButton } from '../../create'

export function generateThemeDefault(params: {
  subscriberId: string;
  config: FormConfig;
  dir: 'rtl' | 'ltr';
  themePreference: 'dark' | 'light';
  paymentMethods: FormSetting['paymentMethodSetting'];
  footerInfo: {
    PRICE_INFO: string;
    FOOTER_DESC: string;
    DISCLAIMER: string;
    ZOTLO_LEGALS_DESC: string;
    ZOTLO_LEGALS_LINKS: string
  };
}) {
  const { config, dir, themePreference, paymentMethods, footerInfo } = params;
  const { $t } = useI18n(config.general.localization);
  const isTabTheme = config.design.theme === 'horizontal' && paymentMethods.length > 1;
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

  let tabButtons = '';

  if (isTabTheme) {
    const theme = {
      [PaymentProvider.CREDIT_CARD]: { dark: '.png', light: '_black.png' },
      [PaymentProvider.PAYPAL]: { dark: '_disabled.png', light: '.png' },
      [PaymentProvider.GOOGLE_PAY]: { dark: '.svg', light: '.svg' },
      [PaymentProvider.APPLE_PAY]: { dark: '.svg', light: '.svg' }
    }

    tabButtons = paymentMethods.reduce((acc, item, index) => {
      const postfix = theme[item.providerKey][config.design.darkMode ? 'dark' : 'light'];
      const imgSrc = getCDNUrl(`editor/payment-providers/${item.providerKey}${postfix}`);

      return acc + createButton({
        content: `<img src="${imgSrc}" alt="${item.providerKey}">${
          item.providerKey === PaymentProvider.CREDIT_CARD ? $t('common.card') : ''
        }`,
        className: 'zotlo-checkout__tab__button',
        attrs: {
          type: 'button',
          'data-active': index === 0 ? 'true' : 'false',
          'data-tab': item.providerKey,
          'aria-label': item.providerKey
        }
      });
    }, '');
  }

  return template(mainHTML, {
    DIR: dir,
    DARK_MODE: themePreference,
    THEME: config.design.theme === 'horizontal' && paymentMethods.length > 1 ? 'horizontal' : 'vertical',
    TAB_BUTTONS: tabButtons,
    PROVIDERS: providerButtons,
    PRICE_INFO: footerInfo.PRICE_INFO,
    FOOTER_DESC: footerInfo.FOOTER_DESC,
    DISCLAIMER: footerInfo.DISCLAIMER,
    ZOTLO_LEGALS_DESC: footerInfo.ZOTLO_LEGALS_DESC,
    ZOTLO_LEGALS_LINKS: footerInfo.ZOTLO_LEGALS_LINKS,
    ATTRIBUTES: generateAttributes({ autocomplete: 'off' })
  });
}
