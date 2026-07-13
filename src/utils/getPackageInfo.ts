import { type FormConfig, PackageCondition, PackageInfoType, PackageType, TrialPackageType } from "../lib/types";
import { useI18n, getIsDiscountCodeApplied } from "../utils";
import { template } from "./template";

export function getPackageInfo(config?: FormConfig, numberOnly?: boolean): PackageInfoType {
  if (!config) return {} as PackageInfoType;

  const isTrialUsed = config?.paymentData?.subscriberStatuses?.isTrialUseBefore || false;

  const periodsInfo = getPackagePeriodsInfo(config);
  const pricesInfo = getPackagePrices(config, numberOnly);
  const totalPayableAmount = getTotalPayableAmount(config, { isTrialUsed, numberOnly });
  const totalPayableBaseAmount = getTotalPayableAmount(config, { isTrialUsed, useBasePrices: true, numberOnly });
  const condition = getPackageCondition(config, { isTrialUsed });
  const state = getPackageState(config, { isTrialUsed });
  const discount = getDiscountPrices(config, totalPayableAmount, numberOnly);
  const isProviderRefreshNecessary = getIsProviderRefreshNecessary(config, { isTrialUsed });

  return {
    ...periodsInfo,
    ...pricesInfo,
    totalPayableAmount,
    totalPayableBaseAmount,
    condition,
    state,
    discount,
    isProviderRefreshNecessary
  };
}

export function getQuantityInfo(config: FormConfig, onlyUnits?: boolean) {
  const { $t } = useI18n(config.general.localization);
  const quantity = config?.settings?.quantitySetting?.quantity || 1;
  const templateParams = getPackageTemplateParams(config);
  if (+quantity <= 1) return "";

  if (onlyUnits) {
    return template($t('form.quantity.includesNumberUnits'), templateParams)
  }

  return template($t('form.quantity.info'), templateParams);
}

export function getDiscountPrices(config?: FormConfig, defaultPrice?: string | number, numberOnly?: boolean) {
  const { discountPrice, originalPrice, totalPrice } = config?.paymentData?.discount || {};
  let currency = config?.paymentData?.selectedPrice?.currency || '';

  defaultPrice = (defaultPrice || (numberOnly ? 0 : `0.00 ${currency}`));

  return {
    price: numberOnly
      ? (discountPrice ? parseFloat(''+discountPrice) : 0)
      : `${discountPrice || '0.00'} ${currency}`,
    original: originalPrice
      ? numberOnly ? parseFloat(''+originalPrice) : `${originalPrice} ${currency}`
      : defaultPrice,
    total: totalPrice
      ? numberOnly ? parseFloat(''+totalPrice) : `${totalPrice} ${currency}`
      : defaultPrice,
  }
}

export function getPackagePrices(config?: FormConfig, numberOnly?: boolean) {
  const { paymentData } = config || {};
  const { packageType, trialPackageType } = paymentData?.package || {};
  const { price, currency = '', trialPrice = '', dailyPrice, weeklyPrice, basePrice, baseTrialPrice } = paymentData?.selectedPrice || {};
  const { discountedPackagePrice, discountedPackageTrialPrice = '', discountedDailyPrice, discountedWeeklyPrice, totalPrice } = paymentData?.discount || {};

  const isDiscountCodeApplied = getIsDiscountCodeApplied(config || {} as FormConfig);

  const priceValue = isDiscountCodeApplied ? discountedPackagePrice || totalPrice : price;
  const currencyValue = currency;
  let trialPriceValue = '0.00';
  if (packageType === PackageType.SUBSCRIPTION && trialPackageType === TrialPackageType.STARTING_PRICE) {
    trialPriceValue = isDiscountCodeApplied ? discountedPackageTrialPrice : trialPrice;
  }
  const dailyPriceValue = isDiscountCodeApplied ? discountedDailyPrice : dailyPrice;
  const weeklyPriceValue = isDiscountCodeApplied ? discountedWeeklyPrice : weeklyPrice;

  function formatPrice(value?: string | number) {
    if (numberOnly) {
      return value ? parseFloat((+value).toFixed(2)) : '';
    }

    return value ? `${(+value)?.toFixed(2)} ${currencyValue}` : '';
  }

  return {
    basePrice: formatPrice(basePrice),
    baseTrialPrice: formatPrice(baseTrialPrice),
    price: formatPrice(priceValue),
    trialPrice: formatPrice(trialPriceValue),
    dailyPrice: formatPrice(dailyPriceValue),
    weeklyPrice: formatPrice(weeklyPriceValue),
    purePrice: formatPrice(price),
    pureTrialPrice: formatPrice(trialPrice),
    discountedPackagePrice: formatPrice(discountedPackagePrice),
    discountedPackageTrialPrice: formatPrice(discountedPackageTrialPrice),
    discountedDailyPrice: formatPrice(discountedDailyPrice),
    discountedWeeklyPrice: formatPrice(discountedWeeklyPrice),
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

export function getTotalPayableAmount(config?: FormConfig, options?: { isTrialUsed?: boolean, useBasePrices?: boolean, numberOnly?: boolean }): string | number {
  const { paymentData } = config || {};
  if (!paymentData?.package?.packageId) return '0.00 USD';
  const { isTrialUsed = false, useBasePrices = false } = options || {};
  const isDiscountCodeApplied = getIsDiscountCodeApplied(config || {} as FormConfig);
  const {
    packageType,
    trialPackageType,
  } = paymentData?.package || {};
  const { price, trialPrice, basePrice, baseTrialPrice, currency } = getPackagePrices(config, options?.numberOnly);

  if (isDiscountCodeApplied && !useBasePrices) return getDiscountPrices(config, undefined, options?.numberOnly).total;
  
  let finalAmount = useBasePrices ? basePrice : price;
  const trialPriceValue = useBasePrices ? baseTrialPrice : trialPrice;
  if (packageType === PackageType.SUBSCRIPTION && !isTrialUsed) {
    switch (trialPackageType) {
      case TrialPackageType.FREE_TRIAL: {
        finalAmount = options?.numberOnly ? 0 : `0.00 ${currency}`;
        break;
      }
      case TrialPackageType.STARTING_PRICE: {
        finalAmount = trialPriceValue;
        break;
      }
      default:
        break;
    }
  }
  return options?.numberOnly ? parseFloat(''+finalAmount) : `${finalAmount}`;
}

function getPackageCondition(config?: FormConfig, options?: { isTrialUsed?: boolean }):PackageInfoType['condition'] {
  const { isTrialUsed = false } = options || {};

  let condition = 'package_with_trial' as PackageInfoType['condition'];
  const { isOneTimePayment, isNoTrial, isTrialUsed:isTrialUsedValue } = getPackageTypeConditions(config || {} as FormConfig, { isTrialUsed });

  if (isOneTimePayment) {
    condition = PackageCondition.ONETIME_PAYMENT;
  } else if (isNoTrial) {
    condition = PackageCondition.PLAN_WITH_NO_TRIAL;
  } else if (isTrialUsedValue) {
    condition = PackageCondition.PACKAGE_WITH_TRIAL_USED;
  }

  return condition;
}

function getPackageState(config?: FormConfig, options?: { isTrialUsed?: boolean }) {
  const { isTrialUsed = false } = options || {};
  const condition = getPackageCondition(config, { isTrialUsed });

  const states:Record<string, keyof FormConfig['design']['button']['text']> = {
    onetime_payment: 'onetimePayment',
    plan_with_no_trial: 'subscriptionActivationState',
    package_with_trial: 'trialActivationState',
    package_with_trial_used: 'subscriptionActivationState',
  }

  return states[condition] || states.plan_with_no_trial;
}

export function getIsProviderRefreshNecessary(config?: FormConfig, options?: { isTrialUsed?: boolean }): boolean {
  const { isTrialUsed = false } = options || {};
  const condition = getPackageCondition(config, { isTrialUsed });
  return !['onetime_payment', 'plan_with_no_trial'].includes(condition);
}

export function getPackageTemplateParams(config: FormConfig) {
  if (!config || !config?.packageInfo) return {};

  const { packageInfo, paymentData } = config || {};
  const { period = 0, trialPeriod = 0, periodType, trialPeriodType } = packageInfo || {};
  const { $t } = useI18n(config.general.localization);

  let periodLabel = '';
  let periodNaming = '';
  let trialPeriodLabel = '';
  let trialPeriodNaming = '';


  if (period !== 0) {
    periodLabel = $t(`common.periodBase.${periodType}`, { count: period });

    if (period === 1) {
      periodNaming = $t(`common.periodNaming.${periodType}`);
    } else {
      periodNaming = periodLabel;
    }
  }

  if (trialPeriod !== 0) {
    trialPeriodLabel = $t(`common.periodBase.${trialPeriodType}`, { count: trialPeriod })

    if (trialPeriod === 1) {
      periodNaming = $t(`common.periodNaming.${trialPeriodType}`);
    } else {
      trialPeriodNaming = trialPeriodLabel;
    }
  }


  return {
    QUANTITY: config?.settings?.quantitySetting?.quantity || 1,
    UNIT_PRICE: packageInfo?.totalPayableBaseAmount || "",
    PRICE: packageInfo?.price || "",
    BASE_PRICE: packageInfo?.basePrice || "",
    BASE_TRIAL_PRICE: packageInfo?.baseTrialPrice || "",
    PURE_PRICE: packageInfo?.purePrice || "",
    PURE_TRIAL_PRICE: packageInfo?.pureTrialPrice || "",
    DISCOUNTED_PRICE: packageInfo?.discountedPackagePrice || "",
    DISCOUNTED_TRIAL_PRICE: packageInfo?.discountedPackageTrialPrice || "",
    DISCOUNTED_DAILY_PRICE: packageInfo?.discountedDailyPrice || "",
    DISCOUNTED_WEEKLY_PRICE: packageInfo?.discountedWeeklyPrice || "",
    DISCOUNTED_RECURRING_BILLING_PERIOD: paymentData?.discount?.recurringBillingPeriod || '',
    TRIAL_PRICE: packageInfo?.trialPrice || "",
    DAILY_PRICE: packageInfo?.dailyPrice || "",
    WEEKLY_PRICE: packageInfo?.weeklyPrice || "",
    PERIOD: periodLabel,
    PERIOD_TYPE: periodType,
    PERIOD_NAMING: periodNaming,
    TRIAL_PERIOD: trialPeriodLabel,
    TRIAL_PERIOD_TYPE: trialPeriodType,
    TRIAL_PERIOD_NAMING: trialPeriodNaming
  };
}

export function getPackageTypeConditions(config: FormConfig, options?: { isTrialUsed?: boolean }) {
  const { paymentData } = config || {};
  const { customPrice, customCurrency } = config?.general || {};
  const { isTrialUsed = false } = options || {};

  const hasCustomPrice = !!customPrice && !!customCurrency;

  const { packageType = PackageType.CONSUMABLE, trialPackageType = TrialPackageType.NO } = paymentData?.package || {};

  const isConsumable = packageType === PackageType.CONSUMABLE;
  const isSubscription = packageType === PackageType.SUBSCRIPTION;
  const isEpin = packageType === PackageType.EPIN;
  const isOneTimePayment = isConsumable || isEpin || hasCustomPrice;
  const isFreeTrial = isSubscription && trialPackageType === TrialPackageType.FREE_TRIAL;
  const isPaidTrial = isSubscription && trialPackageType === TrialPackageType.STARTING_PRICE;
  const isNoTrial = isSubscription && trialPackageType === TrialPackageType.NO;
  const isTrialUsedValue = isTrialUsed && (isFreeTrial || isPaidTrial);

  return {
    isOneTimePayment,
    isSubscription,
    isConsumable,
    isEpin,
    isFreeTrial,
    isPaidTrial,
    isNoTrial,
    isTrialUsed: isTrialUsedValue
  }
}

export function getPlanInfoText(config: FormConfig) {
  const { paymentData } = config || {};
  const {
    trialPackageType = TrialPackageType.NO,
  } = paymentData?.package || {};
  const { $t } = useI18n(config.general.localization);
  let text = "";
  const templateParams = getPackageTemplateParams(config);
  const { isOneTimePayment } = getPackageTypeConditions(config);

  if (isOneTimePayment) {
    text = $t("paymentSuccess.paymentDetails.packagePriceInfo.oneTimePayment");
  } else {
    const trialTexts = {
      [TrialPackageType.FREE_TRIAL]: $t("paymentSuccess.paymentDetails.packagePriceInfo.freeTrial"),
      [TrialPackageType.STARTING_PRICE]: $t("paymentSuccess.paymentDetails.packagePriceInfo.startingPrice"),
      [TrialPackageType.NO]: $t("paymentSuccess.paymentDetails.packagePriceInfo.noTrial"),
    };
    text = trialTexts[trialPackageType] || "";
  }

  return template(text, templateParams);
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

    const { isOneTimePayment, isSubscription } = getPackageTypeConditions(config);

    if (isSubscription) {
      packageName = $t(`subscription.${periodInfo.periodType}`);
    } else if (isOneTimePayment) {
      packageName = $t('onetimePayment');
    }
  }

  return packageName;
}
