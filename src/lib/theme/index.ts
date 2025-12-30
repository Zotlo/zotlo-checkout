import { preparePaymentMethods, useI18n, prepareFooterInfo } from "../../utils";
import { template } from "../../utils/template";
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
  const dir = ['he', 'ar'].includes(config?.general.language) ? 'rtl' : 'ltr';
  const themePreference = config?.design?.darkMode ? 'dark' : 'light';
  const paymentMethodSetting = config?.settings?.paymentMethodSetting;
  const hasPaypal = paymentMethodSetting?.some((item) => item.providerKey === PaymentProvider.PAYPAL);
  const hasOnlyPaypalButNotShown = hasPaypal && !config.general.showPaypal && paymentMethodSetting.length === 1;
  const hasAnyConfig = Object.keys(config?.settings).length > 0;

  if (!hasAnyConfig || hasOnlyPaypalButNotShown) {
    return generateEmptyPage({ config });
  }

  const paymentMethods = preparePaymentMethods(config);
  const footerInfo = prepareFooterInfo({ config });

  if (config.design.theme === DesignTheme.MOBILEAPP) {
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
