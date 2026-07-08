import mainHTML from './html/main.html?raw';
import { generateAttributes, generateTabButtons, useI18n } from '../../../utils'
import { template } from "../../../utils/template";
import { PaymentProvider, type FormConfig, type FormSetting, type FooterInfo, PackageType, PackageCondition } from '../../types';
import { createCreditCardForm, createFooter, createPaymentHeader, createPriceTable, prepareDiscountSection } from '../../create'
import { getQuantityInfo } from '../../../utils/getPackageInfo';
import { prepareProvider } from './utils';

export function generateThemeMobileApp(params: {
  config: FormConfig;
  dir: 'rtl' | 'ltr';
  themePreference: 'dark' | 'light';
  paymentMethods: FormSetting['paymentMethodSetting'];
  footerInfo: FooterInfo;
}) {
  const { config, dir, themePreference, paymentMethods, footerInfo } = params;

  const { $t } = useI18n(config.general.localization);
  const providerGroups = paymentMethods.filter((_, index) => index > 0);
  const firstProvider = paymentMethods?.[0];
  const tabButtons = providerGroups.length > 1 ? generateTabButtons(config, providerGroups) : '';

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
  const additionalPrice = `0.00 ${config.general.currency}`;

  if (providerButtons) {
    primaryProvider += `<div class="zotlo-checkout__seperator"><span>${$t('common.orAnotherWay')}</span></div>`
  }

  const hasProductConfig = Object.prototype.hasOwnProperty.call(config.design, 'product');
  const showProductImage = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'productImage') ? !!config.design?.product?.productImage?.show : true;
  const showAdditonalText = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'additionalText') ? !!config.design?.product?.additionalText?.show : true;
  const productImage = showProductImage ? (config.general.productImage || config.design?.product?.productImage.url || '') : '';
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
  const footer = createFooter(footerInfo) || '';
  let priceTable = '';
  
  if (config.packageInfo?.condition !== PackageCondition.ONETIME_PAYMENT) {
    priceTable = createPriceTable({ config }) || '';
  }

  const isSubscription = config.paymentData?.package?.packageType === PackageType.SUBSCRIPTION;

  return template(mainHTML, {
    DIR: dir,
    DARK_MODE: themePreference,
    ATTRIBUTES: generateAttributes({
      autocomplete: 'off',
      ...(config.cardUpdate ? {'data-type': 'card'} : {})
    }),
    HEADER: paymentHeader || '',
    PRICE_TABLE: priceTable || '',
    SHOW_TOTAL: !isSubscription,
    PACKAGE_SUMMARY: !config.cardUpdate,
    PACKAGE_IMAGE: productImage,
    PACKAGE_PRICE: packagePrice,
    STATIC_SUBTOTAL: $t('common.subtotal'),
    STATIC_TOTAL: $t('common.totalDue'),
    ADDITIONAL_TEXT: additionalText,
    ADDITIONAL_PRICE: additionalPrice,
    TOTAL_PRICE: totalPrice,
    QUANTITY_INFO: getQuantityInfo(config),
    DISCOUNT_SECTION: isSubscription ? '' : prepareDiscountSection({ config }),
    PRIMARY_PROVIDER: primaryProvider,
    TAB_BUTTONS: tabButtons,
    PROVIDERS: providerButtons,
    FOOTER: footer
  })
}
