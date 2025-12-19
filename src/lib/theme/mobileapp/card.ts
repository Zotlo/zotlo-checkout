import mainHTML from './html/main.html?raw';
import { generateAttributes } from '../../../utils'
import { template } from "../../../utils/template";
import { PaymentProvider, type FormConfig, type FormSetting } from '../../types';
import { createPaymentHeader } from '../../create'
import { prepareProvider } from './utils';

export function generateCardUpdateThemeMobileApp(params: {
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
  const creditCard = paymentMethods
    .find((item) => item.providerKey === PaymentProvider.CREDIT_CARD) as FormSetting['paymentMethodSetting'][number];

  const paymentHeader = createPaymentHeader({ config }) || '';
  const primaryProvider = prepareProvider({
    config,
    paymentMethods: [],
    method: creditCard,
    index: 0,
    tabAvailable: false
  }) || '';

  return template(mainHTML, {
    PACKAGE_SUMMARY: false,
    DIR: dir,
    DARK_MODE: themePreference,
    HEADER: paymentHeader,
    PRIMARY_PROVIDER: primaryProvider,
    PROVIDERS: '',
    PRICE_INFO: footerInfo.PRICE_INFO,
    FOOTER_DESC: footerInfo.FOOTER_DESC,
    DISCLAIMER: footerInfo.DISCLAIMER,
    ZOTLO_LEGALS_DESC: footerInfo.ZOTLO_LEGALS_DESC,
    ZOTLO_LEGALS_LINKS: footerInfo.ZOTLO_LEGALS_LINKS,
    ATTRIBUTES: generateAttributes({ autocomplete: 'off', 'data-type': 'card' }),
  })
}
