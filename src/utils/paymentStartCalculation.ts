export type PaymentPeriodType = 'day' | 'week' | 'month' | 'year';

export type PaymentDateInfo = {
  /** Zero-padded day of month, e.g. '06', '29' */
  day: string;
  /** Full month name, e.g. 'July', 'August' */
  month: string;
  dayNumber: number;
  /** 1-indexed month number, e.g. 5 for May, 1 for January */
  monthNumber: number;
  /** Underlying date, useful for locale-aware formatting by consumers. */
  date: Date;
};

export type PaymentStartCalculationParams = {
  /** Reference date the calculation starts from. Defaults to now. */
  dateNow?: Date;
  /** Subscription trial period length. */
  trialPeriod: number;
  trialPeriodType: PaymentPeriodType;
  /** Subscription billing period length. */
  period: number;
  periodType: PaymentPeriodType;
  /** Number of discounted recurring billing cycles. 0/undefined means none. */
  discountedRecurringBillingPeriod?: number;
};

export type PaymentStartCalculationResult = {
  /** Date the recurring billing starts (trial end). Null when there are no discounted cycles. */
  recurringBillingStartDate: PaymentDateInfo | null;
  /** Date the regular (non-discounted) payment starts. */
  paymentStartDate: PaymentDateInfo;
};

function addPeriod(date: Date, amount: number, type: PaymentPeriodType): Date {
  const result = new Date(date.getTime());
  switch (type) {
    case 'day':
      result.setDate(result.getDate() + amount);
      break;
    case 'week':
      result.setDate(result.getDate() + amount * 7);
      break;
    case 'month':
      result.setMonth(result.getMonth() + amount);
      break;
    case 'year':
      result.setFullYear(result.getFullYear() + amount);
      break;
  }
  return result;
}

function toDateInfo(date: Date): PaymentDateInfo {
  const dayNumber = date.getDate();
  return {
    day: String(dayNumber).padStart(2, '0'),
    month: date.toLocaleString('en-US', { month: 'long' }),
    dayNumber,
    monthNumber: date.getMonth() + 1,
    date,
  };
}

/**
 * Calculates the payment start date based on the trial period and, when present,
 * the discounted recurring billing cycles.
 *
 * Flow:
 * 1. Start from `dateNow` and add the trial period to get the initial payment start date.
 * 2. If `discountedRecurringBillingPeriod` is greater than 0, that date becomes the
 *    recurring billing start date, and the payment start date is pushed forward by
 *    `discountedRecurringBillingPeriod` billing periods — i.e. regular billing starts
 *    only after every discounted cycle has elapsed.
 */
export function calculatePaymentStartDate(
  params: PaymentStartCalculationParams
): PaymentStartCalculationResult {
  const {
    dateNow = new Date(),
    trialPeriod,
    trialPeriodType,
    period,
    periodType,
    discountedRecurringBillingPeriod = 0,
  } = params;

  // 1. Apply the trial period.
  let paymentStartDate = addPeriod(dateNow, trialPeriod, trialPeriodType);
  let recurringBillingStartDate: Date | null = null;

  // 2. Apply the discounted recurring billing cycles, if any.
  if (discountedRecurringBillingPeriod > 0) {
    recurringBillingStartDate = paymentStartDate;
    paymentStartDate = addPeriod(
      paymentStartDate,
      discountedRecurringBillingPeriod * period,
      periodType
    );
  }

  return {
    recurringBillingStartDate: recurringBillingStartDate
      ? toDateInfo(recurringBillingStartDate)
      : null,
    paymentStartDate: toDateInfo(paymentStartDate),
  };
}
