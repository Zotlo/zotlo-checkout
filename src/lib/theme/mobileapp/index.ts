import mainHTML from './html/main.html';
import { getCDNUrl, template, useI18n } from '../../../utils'
import { PaymentProvider, type FormConfig, type FormSetting } from '../../types';
import { createProviderButton, createButton, createCreditCardForm } from '../../create'

function prepareProvider(params: {
  config: FormConfig;
  subscriberId: string;
  paymentMethods: FormSetting['paymentMethodSetting'];
  method: FormSetting['paymentMethodSetting'][number];
  index: number;
  tabAvailable?: boolean;
}) {
  const { config, paymentMethods, method, index, tabAvailable } = params;

  if (method.providerKey !== PaymentProvider.CREDIT_CARD) {
    return createProviderButton({
      provider: method.providerKey,
      config,
      tabAvailable: !!index
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
      formType: index === 0 ? 'both' : 'creditCard',
      seperator,
      className: 'zotlo-checkout__payment-provider',
      attrs: tabAvailable ?  { 'data-tab-content': PaymentProvider.CREDIT_CARD, 'data-tab-active': 'true' } : {},
      showPrice: false
    });
  }
}

export function generateThemeMobileApp(params: {
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
  const providerGroups = paymentMethods.filter((_, index) => index > 0);
  const firstProvider = paymentMethods?.[0];

  const theme = {
    [PaymentProvider.CREDIT_CARD]: { dark: '.png', light: '_black.png' },
    [PaymentProvider.PAYPAL]: { dark: '_disabled.png', light: '.png' },
    [PaymentProvider.GOOGLE_PAY]: { dark: '.svg', light: '.svg' },
    [PaymentProvider.APPLE_PAY]: { dark: '.svg', light: '.svg' }
  }

  const tabButtons = providerGroups.length > 1
    ? providerGroups.reduce((acc, item, index) => {
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
      }, '')
    : '';

  let primaryProvider = prepareProvider({
    subscriberId: params.subscriberId,
    config,
    paymentMethods,
    method: firstProvider,
    index: 0,
    tabAvailable: false
  }) || '';

  if (firstProvider?.providerKey !== PaymentProvider.CREDIT_CARD) {
    primaryProvider = createCreditCardForm({
      ...params,
      formType: 'subscriberId',
      className: 'zotlo-checkout__payment-provider',
      showPrice: false
    }) + primaryProvider;
  }

  let providerButtons = providerGroups.map((method, index) => prepareProvider({
    subscriberId: params.subscriberId,
    config,
    paymentMethods,
    method,
    index: index + 1,
    tabAvailable: true
  })).join('');

  const totalPrice = config.paymentData?.selectedPrice.price || "0.00";
  const currency = config.paymentData?.selectedPrice.currency || config.general.currency || "USD";

  if (providerButtons) {
    primaryProvider += `<div class="zotlo-checkout__seperator"><span>${$t('common.orAnotherWay')}</span></div>`
  }

  return template(mainHTML, {
    DIR: dir,
    DARK_MODE: themePreference,
    APP_NAME: config.general.appName,
    LOGO: config.general.appLogo,
    PACKAGE_NAME: config.general.packageName,
    PACKAGE_IMAGE: config.general.productImage,
    PRIMARY_PROVIDER: primaryProvider,
    TAB_BUTTONS: tabButtons,
    PROVIDERS: providerButtons,
    TOTAL_PRICE: `${totalPrice} ${currency}`,
    ADDITIONAL_TEXT: config.general.additionalText || '',
    ADDITIONAL_PRICE: `0.00 ${currency}`,
    STATIC_SUBTOTAL: $t('common.subtotal'),
    STATIC_TOTAL: $t('common.totalDue'),
    PRICE_INFO: footerInfo.PRICE_INFO,
    FOOTER_DESC: footerInfo.FOOTER_DESC,
    DISCLAIMER: footerInfo.DISCLAIMER,
    ZOTLO_LEGALS_DESC: footerInfo.ZOTLO_LEGALS_DESC,
    ZOTLO_LEGALS_LINKS: footerInfo.ZOTLO_LEGALS_LINKS
  })
}
