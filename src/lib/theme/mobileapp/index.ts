import mainHTML from './html/main.html?raw';
import { generateAttributes, getCDNUrl, useI18n } from '../../../utils'
import { template } from "../../../utils/template";
import { PaymentProvider, type FormConfig, type FormSetting } from '../../types';
import { createButton, createCreditCardForm, createPaymentHeader } from '../../create'
import { getPackageName, getQuantityInfo } from '../../../utils/getPackageInfo';
import { prepareProvider } from './utils';

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
  let tabButtons = '';
  
  if (providerGroups.length > 1) {
    const theme = {
      [PaymentProvider.CREDIT_CARD]: { dark: '.png', light: '_black.png' },
      [PaymentProvider.PAYPAL]: { dark: '_disabled.png', light: '.png' },
      [PaymentProvider.GOOGLE_PAY]: { dark: '.svg', light: '.svg' },
      [PaymentProvider.APPLE_PAY]: { dark: '.svg', light: '.svg' }
    };

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
  const showProductImage = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'productImage') ? !!config.design?.product?.productImage?.show : true;
  const showSubtotal = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'showSubtotalText') ? !!config.design?.product?.showSubtotalText : true;
  const showAdditonalText = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'additionalText') ? !!config.design?.product?.additionalText?.show : true;
  const productImage = showProductImage ? (config.general.productImage || config.design?.product?.productImage.url || '') : '';
  const packageName = getPackageName(config);
  const additionalText = showAdditonalText
    ? (
      config.general.additionalText ||
      (
        config.design?.product?.additionalText?.text?.[config.general.language] ||
        config.design?.product?.additionalText?.text?.en || ''
      )
    )
    : '';

  const paymentHeader = createPaymentHeader({ config });

  return template(mainHTML, {
    DIR: dir,
    DARK_MODE: themePreference,
    ATTRIBUTES: generateAttributes({
      autocomplete: 'off',
      ...(config.cardUpdate ? {'data-type': 'card'} : {})
    }),
    HEADER: paymentHeader || '',
    PACKAGE_SUMMARY: !config.cardUpdate,
    PACKAGE_IMAGE: productImage,
    PACKAGE_NAME: packageName,
    PACKAGE_PRICE: packagePrice,
    SHOW_SUBTOTAL: !!packageName && showSubtotal,
    STATIC_SUBTOTAL: $t('common.subtotal'),
    STATIC_TOTAL: $t('common.totalDue'),
    ADDITIONAL_TEXT: additionalText,
    ADDITIONAL_PRICE: additionalPrice,
    TOTAL_PRICE: totalPrice,
    QUANTITY_INFO: getQuantityInfo(config),
    PRIMARY_PROVIDER: primaryProvider,
    TAB_BUTTONS: tabButtons,
    PROVIDERS: providerButtons,
    PRICE_INFO: footerInfo.PRICE_INFO,
    FOOTER_DESC: footerInfo.FOOTER_DESC,
    DISCLAIMER: footerInfo.DISCLAIMER,
    ZOTLO_LEGALS_DESC: footerInfo.ZOTLO_LEGALS_DESC,
    ZOTLO_LEGALS_LINKS: footerInfo.ZOTLO_LEGALS_LINKS,
  })
}
