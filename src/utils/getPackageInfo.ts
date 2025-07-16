import { type FormConfig, PackageInfoType, PackageType, TrialPackageType } from "../lib/types";
import { useI18n } from "../utils";

export function getPackageInfo(config?: FormConfig): PackageInfoType {
  if (!config) return {} as PackageInfoType;

  const periodsInfo = getPackagePeriodsInfo(config);
  const pricesInfo = getPackagePrices(config);
  const totalPayableAmount = getTotalPayableAmount(config);
  const condition = getPackageCondition(config);
  const state = getPackageState(config);
  const discount = getDiscountPrices(config, totalPayableAmount);

  return {
    ...periodsInfo,
    ...pricesInfo,
    totalPayableAmount,
    condition,
    state,
    discount
  };
}

export function getDiscountPrices(config?: FormConfig, defaultPrice?: string) {
  const { customPrice, customCurrency } = config?.general || {};
  const { discountPrice, originalPrice, totalPrice } = config?.paymentData?.discount || {};
  let currency = config?.paymentData?.selectedPrice?.currency || '';
  
  const hasCustomPrice = !!customPrice && !!customCurrency;
  if (hasCustomPrice) currency = customCurrency;

  defaultPrice = (defaultPrice || `0.00 ${currency}`);

  return {
    price: `${discountPrice || '0.00'} ${currency}`,
    original: originalPrice ? `${originalPrice} ${currency}` : defaultPrice,
    total: totalPrice ? `${totalPrice} ${currency}` : defaultPrice,
  }
}

export function getPackagePrices(config?: FormConfig) {
  const { paymentData } = config || {};
  const { packageType, trialPackageType } = paymentData?.package || {};
  const { price, currency = '', trialPrice = '', dailyPrice, weeklyPrice } = paymentData?.selectedPrice || {};
  const { customPrice, customCurrency } = config?.general || {};
  const hasCustomPrice = !!customPrice && !!customCurrency;

  const priceValue = hasCustomPrice ? customPrice : price;
  const currencyValue = hasCustomPrice ? customCurrency : currency;

  let trialPriceValue = '0.00';
  if (packageType === PackageType.SUBSCRIPTION && trialPackageType === TrialPackageType.STARTING_PRICE) {
    trialPriceValue = trialPrice;
  }

  return {
    price: `${(priceValue ? +priceValue : 0)?.toFixed(2)} ${currencyValue}`,
    trialPrice: `${trialPriceValue} ${currencyValue}`,
    dailyPrice: `${dailyPrice} ${currencyValue}`,
    weeklyPrice: `${weeklyPrice} ${currencyValue}`,
    currency: currencyValue,
  };
}

export function getPackagePeriodsInfo(config?: FormConfig) {
  const {
    period = 0,
    periodType = "",
    packageType,
    trialPeriod = 0,
    trialPeriodType = "",
    trialPackageType
  } = config?.paymentData?.package || {};

  const periodObj = { period, periodType }
  const trialPeriodObj = { trialPeriod, trialPeriodType }

  if (packageType === PackageType.CONSUMABLE) {
    return {
      ...periodObj,
      ...trialPeriodObj
    }
  }

  if (trialPackageType === TrialPackageType.NO) {
    trialPeriodObj.trialPeriod = 0;
    trialPeriodObj.trialPeriodType = "";
  }

  if (periodType === "day" && period > 0 && period % 7 === 0) {
    periodObj.period = period / 7;
    periodObj.periodType = "week";
  }

  if (trialPeriodType === "day" && trialPeriod > 0 && trialPeriod % 7 === 0) {
    trialPeriodObj.trialPeriod = trialPeriod / 7;
    trialPeriodObj.trialPeriodType = "week";
  }

  return {
    ...periodObj,
    ...trialPeriodObj
  }
}

export function getTotalPayableAmount(config?: FormConfig, options?: { isTrialUsed?: boolean }) {
  const { paymentData } = config || {};
  if (!paymentData?.package?.packageId) return '';
  const { isTrialUsed = false } = options || {};
  const {
    packageType,
    trialPackageType,
  } = paymentData?.package || {};
  const { price, trialPrice, currency } = getPackagePrices(config);
  const { customPrice, customCurrency } = config?.general || {};
  
  const hasCustomPrice = !!customPrice && !!customCurrency;
  if (hasCustomPrice) return `${customPrice} ${customCurrency}`;

  let priceValue = price;
  if (packageType === PackageType.SUBSCRIPTION && !isTrialUsed) {
    switch (trialPackageType) {
      case TrialPackageType.FREE_TRIAL: {
        priceValue = `0.00 ${currency}`;
        break;
      }
      case TrialPackageType.STARTING_PRICE: {
        priceValue = trialPrice;
        break;
      }
      default:
        break;
    }
  }
  return `${priceValue}`;
}

function getPackageCondition(config?: FormConfig, options?: { isTrialUsed?: boolean }):PackageInfoType['condition'] {
  const { paymentData } = config || {};
  const { isTrialUsed = false } = options || {};
  const {
    packageType,
    trialPackageType,
  } = paymentData?.package || {};
  const { customPrice, customCurrency } = config?.general || {};
  const hasCustomPrice = !!customPrice && !!customCurrency;

  let condition = 'package_with_trial' as PackageInfoType['condition'];
  const isOneTimePayment = [PackageType.CONSUMABLE, PackageType.EPIN].includes(packageType as PackageType) || hasCustomPrice;
  const isNoTrial = !trialPackageType || trialPackageType === TrialPackageType.NO;
  const isTrialUsedValue = trialPackageType && isTrialUsed;

  if (isOneTimePayment) {
    condition = 'onetime_payment';
  } else if (isNoTrial) {
    condition = 'plan_with_no_trial'
  } else if (isTrialUsedValue) {
    condition = 'package_with_trial_used';
  }

  return condition;
}

function getPackageState(config?: FormConfig) {
  const condition = getPackageCondition(config);

  const states:Record<string, keyof FormConfig['design']['button']['text']> = {
    onetime_payment: 'onetimePayment',
    plan_with_no_trial: 'subscriptionActivationState',
    package_with_trial: 'trialActivationState',
    package_with_trial_used: 'subscriptionActivationState',
  }

  return states[condition] || states.plan_with_no_trial;
}

export function getPackageTemplateParams(config: FormConfig) {
  if (!config || !config?.packageInfo) return {};

  const { packageInfo } = config;
  const { period = 0, trialPeriod = 0, periodType, trialPeriodType } = packageInfo || {};
  const { $t } = useI18n(config.general.localization);

  return {
    PRICE: packageInfo?.price || "",
    TRIAL_PRICE: packageInfo?.trialPrice || "",
    DAILY_PRICE: packageInfo?.dailyPrice || "",
    WEEKLY_PRICE: packageInfo?.weeklyPrice || "",
    PERIOD: period === 0 ? '' : $t(`common.periods.${periodType}`, { count: period }),
    TRIAL_PERIOD: period === 0 ? '' : $t(`common.periods.${trialPeriodType}`, { count: trialPeriod }),
  };
}

export function getPackageName(config: FormConfig) {
  const hasProductConfig = Object.prototype.hasOwnProperty.call(config.design, 'product');
  const showProductName = hasProductConfig && Object.prototype.hasOwnProperty.call(config.design.product, 'showProductTitle')
    ? !!config.design?.product?.showProductTitle
    : true;
  let packageName = showProductName ? config.general.packageName || '' : '';

  if (showProductName && !packageName) {
    const { $t } = useI18n(config.general.localization);
    const { package: packageItem } = config.paymentData || {}
    const periodInfo = getPackagePeriodsInfo(config);

    packageName = packageItem?.name || '';

    if (packageItem?.packageType === PackageType.SUBSCRIPTION) {
      packageName = $t(`subscription.${periodInfo.periodType}`);
    } else if ([PackageType.CONSUMABLE, PackageType.EPIN].includes(packageItem?.packageType as PackageType)) {
      packageName = $t('onetimePayment');
    }
  }

  return packageName;
}
