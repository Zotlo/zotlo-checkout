import mainHTML from './html/main.html?raw';
import { generateAttributes, getCDNUrl, template, useI18n } from '../../../utils'
import { PaymentProvider, type FormConfig, type FormSetting } from '../../types';
import { createProviderButton, createButton, createCreditCardForm } from '../../create'

function prepareProvider(params: {
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

export function generateThemeMobileApp(params: {
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

  let tabButtons = '';

  if (providerGroups.length > 1) {
    tabButtons = providerGroups.reduce((acc, item, index) => {
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
  }

  let primaryProvider = prepareProvider({
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

  const providerButtons = providerGroups.map((method, index) => prepareProvider({
    config,
    paymentMethods,
    method,
    index: index + 1,
    tabAvailable: true
  })).join('');

  const totalPrice = config.packageInfo?.totalPayableAmount || '0.00 USD';
  const packagePrice = config.packageInfo?.discount.original;
  const additionalPrice = config.packageInfo?.discount.price;

  if (providerButtons) {
    primaryProvider += `<div class="zotlo-checkout__seperator"><span>${$t('common.orAnotherWay')}</span></div>`
  }

  const hasProductConfig = Object.prototype.hasOwnProperty.call(config.design, 'product');
  const showHeader = Object.prototype.hasOwnProperty.call(config.design, 'header') ? !!config.design.header?.show : true;
  const showProductImage = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'productImage') ? !!config.design?.product?.productImage?.show : true;
  const showProductName = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'showProductTitle') ? !!config.design?.product?.showProductTitle : true;
  const showSubtotal = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'showSubtotalText') ? !!config.design?.product?.showSubtotalText : true;
  const showAdditonalText = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'additionalText') ? !!config.design?.product?.additionalText?.show : true;
  const productImage = showProductImage ? (config.general.productImage || config.design?.product?.productImage.url || '') : '';
  const productName = showProductName ? config.general.packageName || '' : '';
  const additionalText = showAdditonalText
    ? (
      config.general.additionalText ||
      (
        config.design?.product?.additionalText?.text?.[config.general.language] ||
        config.design?.product?.additionalText?.text?.en || ''
      )
    )
    : '';

  return template(mainHTML, {
    DIR: dir,
    DARK_MODE: themePreference,
    SHOW_HEADER: showHeader && (!!config.general.appName || !!config.general.appLogo),
    APP_NAME: config.general.appName || '',
    LOGO: config.general.appLogo || '',
    PACKAGE_NAME: productName,
    PACKAGE_IMAGE: productImage,
    PRIMARY_PROVIDER: primaryProvider,
    TAB_BUTTONS: tabButtons,
    PROVIDERS: providerButtons,
    TOTAL_PRICE: totalPrice,
    PACKAGE_PRICE: packagePrice,
    ADDITIONAL_TEXT: additionalText,
    ADDITIONAL_PRICE: additionalPrice,
    SHOW_SUBTOTAL: !!productName && showSubtotal,
    STATIC_SUBTOTAL: $t('common.subtotal'),
    STATIC_TOTAL: $t('common.totalDue'),
    PRICE_INFO: footerInfo.PRICE_INFO,
    FOOTER_DESC: footerInfo.FOOTER_DESC,
    DISCLAIMER: footerInfo.DISCLAIMER,
    ZOTLO_LEGALS_DESC: footerInfo.ZOTLO_LEGALS_DESC,
    ZOTLO_LEGALS_LINKS: footerInfo.ZOTLO_LEGALS_LINKS,
    ATTRIBUTES: generateAttributes({ autocomplete: 'off' })
  })
}
