import { createPaymentSuccessForm, prepareButtonSuccessLink } from "../lib/create";
import { type FormConfig, type IZotloCheckoutParams, type IZotloCardParams, PaymentCallbackStatus } from "../lib/types";
import { handlePaymentSuccess } from "./sendPayment";

export enum UrlQuery {
  STATUS = "zc_status",
  CARD_STATUS = "zc_card_status",
  ERROR_MESSAGE = "zc_error_message",
}

export async function handleUrlQuery(payload: {
  params: IZotloCheckoutParams | IZotloCardParams;
  config: FormConfig;
  reloadSession?: () => Promise<void>;
}) {
  const { params, config, reloadSession } = payload || {};
  const queryString = globalThis?.location?.search || "";
  const urlParams = new URLSearchParams(queryString);
  const queryParams = Object.fromEntries(urlParams?.entries());
  const status = config.cardUpdate
    ? queryParams?.[UrlQuery.CARD_STATUS]
    : queryParams?.[UrlQuery.STATUS];
  const errorMessage = queryParams?.[UrlQuery.ERROR_MESSAGE] || "";

  if (status === PaymentCallbackStatus.SUCCESS) {
    const paymentDetail = await handlePaymentSuccess({ config, params });
    if (paymentDetail) createPaymentSuccessForm({ config, paymentDetail });

    if (!config.success.show) {
      if (paymentDetail && config.general.isCheckoutLink) {
        const redirectUrl = prepareButtonSuccessLink({ config, paymentDetail }) || '';
        if (redirectUrl) window.location.href = redirectUrl;
      }

      await reloadSession?.();
    }
  }

  if (status === PaymentCallbackStatus.FAIL) {
    params.events?.onFail?.({ message: errorMessage, data: {} });
  }
}
