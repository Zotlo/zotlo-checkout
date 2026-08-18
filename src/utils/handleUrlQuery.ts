import { createPaymentSuccessForm, prepareButtonSuccessLink } from "../lib/create";
import { type FormConfig, type IZotloCheckoutParams, type IZotloCardParams, type PaymentDetail, PaymentCallbackStatus } from "../lib/types";
import { endPaymentSession, handlePaymentSuccess } from "./sendPayment";
import { getActivePostPaymentOffer } from "./index";
import { handlePostPaymentOffers } from "./postPaymentOffer";

export enum UrlQuery {
  STATUS = "zc_status",
  CARD_STATUS = "zc_card_status",
  ERROR_MESSAGE = "zc_error_message",
}

export function getPaymentCallback(payload: {
  config: FormConfig;
}) {
  const queryString = globalThis?.location?.search || "";
  const urlParams = new URLSearchParams(queryString);
  const queryParams = Object.fromEntries(urlParams?.entries());
  const status = payload.config.cardUpdate
    ? queryParams?.[UrlQuery.CARD_STATUS]
    : queryParams?.[UrlQuery.STATUS];
  const errorMessage = queryParams?.[UrlQuery.ERROR_MESSAGE] || "";

  return {
    status,
    errorMessage,
    success: status === PaymentCallbackStatus.SUCCESS,
    fail: status === PaymentCallbackStatus.FAIL,
  };
}

/** Renders the payment success page and runs the redirect / session reload tail. */
export async function completePaymentSuccess(payload: {
  config: FormConfig;
  paymentDetail: PaymentDetail | null;
  reloadSession?: () => Promise<void>;
}) {
  const { config, paymentDetail, reloadSession } = payload;

  if (paymentDetail) createPaymentSuccessForm({ config, paymentDetail });

  if (!config.success.show) {
    if (paymentDetail && config.general.isCheckoutLink) {
      const redirectUrl = prepareButtonSuccessLink({ config, paymentDetail }) || '';
      if (redirectUrl) window.location.href = redirectUrl;
    }

    await reloadSession?.();
  }
}

/**
 * Hands the rest of the success flow to the post payment offers page when there
 * is an offer to present. Returns true only when the page took over, in which
 * case the caller must not render the success page itself.
 */
function startPostPaymentOffers(payload: {
  params: IZotloCheckoutParams | IZotloCardParams;
  config: FormConfig;
  paymentDetail: PaymentDetail | null;
  reloadSession?: () => Promise<void>;
}) {
  const { params, config, paymentDetail, reloadSession } = payload;

  if (!paymentDetail) return false;
  if (!getActivePostPaymentOffer({ config, paymentDetail })) return false;

  // The offers page owns the rest of the flow, including the session
  const isOffersPageShown = handlePostPaymentOffers({
    config,
    params,
    paymentDetail,
    onComplete: (detail) => completePaymentSuccess({
      config, paymentDetail: detail, reloadSession
    })
  });

  if (isOffersPageShown) return true;

  // Nothing was mounted, so close the session handlePaymentSuccess kept alive
  endPaymentSession({ config, params });

  return false;
}

export async function handleUrlQuery(payload: {
  params: IZotloCheckoutParams | IZotloCardParams;
  config: FormConfig;
  reloadSession?: () => Promise<void>;
}) {
  const { params, config, reloadSession } = payload || {};
  const { errorMessage, success, fail } = getPaymentCallback({ config });

  if (success) {
    const paymentDetail = await handlePaymentSuccess({ config, params });

    if (startPostPaymentOffers({ params, config, paymentDetail, reloadSession })) return;

    await completePaymentSuccess({ config, paymentDetail, reloadSession });
  }

  if (fail) {
    params.events?.onFail?.({ message: errorMessage, data: {} });
  }
}
