import { preparePaymentMethods, template, useI18n } from "../../utils";
import { FormConfig, PaymentProvider } from "../types";
import { generateThemeDefault } from "./default";
import { generateThemeMobileApp } from "./mobileapp";
import noMethodElement from '../../html/nomethod.html'

export function generateTheme(params: {
  config: FormConfig;
}){
  const { config } = params;
  const { $t } = useI18n(config.general?.localization);
  const dir = ['he', 'ar'].includes(config?.general.language) ? 'rtl' : 'ltr';
  const themePreference = config?.design?.darkMode ? 'dark' : 'light';
  const paymentMethodSetting = config?.settings?.paymentMethodSetting;
  const hasPaypal = paymentMethodSetting?.some((item) => item.providerKey === PaymentProvider.PAYPAL);
  const hasOnlyPaypalButNotShown = hasPaypal && !config.general.showPaypal && paymentMethodSetting.length === 1;
  const hasAnyConfig = Object.keys(config?.settings).length > 0;

  if (!hasAnyConfig || hasOnlyPaypalButNotShown) {
    return template(noMethodElement, {
      DIR: dir,
      TITLE: $t('empty.noMethod.title'),
      DESC: $t('empty.noMethod.desc'),
    });
  }

  const privacyUrl = config.general.privacyUrl;
  const tosUrl = config.general.tosUrl;
  const disclaimer = !config?.design?.footer || config?.design?.footer?.showMerchantDisclaimer
    ? $t('footer.disclaimer', {
      termsOfUse: `<a href="${tosUrl}">${$t('common.termsOfUse')}</a>`,
      privacyPolicy: `<a href="${privacyUrl}">${$t('common.privacyPolicy')}</a>`,
    })
    : '';


  const paymentMethods = preparePaymentMethods(config);

  const footerInfo = {
    // TODO: PRICE_INFO will be changed to a dynamic text by package
    PRICE_INFO: $t('footer.priceInfo.package_with_trial'),
    FOOTER_DESC: $t('footer.desc'),
    DISCLAIMER: disclaimer && `<div>${disclaimer}</div>`,
    ZOTLO_LEGALS_DESC: $t('footer.zotlo.legals.desc'),
    ZOTLO_LEGALS_LINKS: `<a href="${tosUrl}">${$t('common.termsOfService')}</a><a href="${privacyUrl}">${$t('common.privacyPolicy')}</a>`
  }

  if (params.config.design.theme === 'mobileapp') {
    return generateThemeMobileApp({
      ...params,
      dir,
      themePreference,
      paymentMethods,
      footerInfo
    });
  }

  return generateThemeDefault({
    ...params,
    dir,
    themePreference,
    paymentMethods,
    footerInfo
  });
}
