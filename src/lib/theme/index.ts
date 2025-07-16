import { preparePaymentMethods, template, useI18n } from "../../utils";
import { getPackageTemplateParams } from "../../utils/getPackageInfo";
import { DesignTheme, FormConfig, PaymentProvider } from "../types";
import { generateThemeDefault } from "./default";
import { generateThemeMobileApp } from "./mobileapp";
import noMethodElement from '../../html/nomethod.html?raw'

export function generateEmptyPage(params: {
  config: FormConfig,
  title?: string,
  message?: string,
}) {
  const { config } = params;
  const { $t } = useI18n(config.general?.localization);
  const dir = ['he', 'ar'].includes(config?.general.language) ? 'rtl' : 'ltr';

  return template(noMethodElement, {
    DIR: dir,
    TITLE: params.title || $t('empty.noMethod.title'),
    DESC: params.message || $t('empty.noMethod.desc'),
  });
}

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
    return generateEmptyPage({ config });
  }

  const privacyUrl = config.general.privacyUrl;
  const tosUrl = config.general.tosUrl;
  const disclaimer = !config?.design?.footer || config?.design?.footer?.showMerchantDisclaimer
    ? $t('footer.disclaimer', {
      termsOfUse: `<a target="_blank" href="${tosUrl}">${$t('common.termsOfUse')}</a>`,
      privacyPolicy: `<a target="_blank" href="${privacyUrl}">${$t('common.privacyPolicy')}</a>`,
    })
    : '';


  const paymentMethods = preparePaymentMethods(config);

  const packageCondition = config?.packageInfo?.condition || 'package_with_trial';
  const footerPriceInfo = template($t(`footer.priceInfo.${packageCondition}`), {
    ...getPackageTemplateParams(config)
  });

  const zotloUrls = config?.general?.zotloUrls || {};

  const footerInfo = {
    PRICE_INFO: footerPriceInfo,
    FOOTER_DESC: $t('footer.desc'),
    DISCLAIMER: disclaimer && `<div>${disclaimer}</div>`,
    ZOTLO_LEGALS_DESC: $t('footer.zotlo.legals.desc'),
    ZOTLO_LEGALS_LINKS: `<a target="_blank" href="${zotloUrls?.termsOfService}">${$t('common.termsOfService')}</a><a target="_blank" href="${zotloUrls?.privacyPolicy}">${$t('common.privacyPolicy')}</a>`
  }

  if (params.config.design.theme === DesignTheme.MOBILEAPP) {
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
