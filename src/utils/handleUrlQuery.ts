import { ZOTLO_GLOBAL } from ".";
import { createPaymentSuccessForm } from "../lib/create";
import { type FormConfig, type IZotloCheckoutParams, PaymentCallbackStatus } from "../lib/types";
import { handlePaymentSuccess } from "./sendPayment";

export enum UrlQuery {
  STATUS = "zc_status",
  CARD_STATUS = "zc_card_status",
  ERROR_MESSAGE = "zc_error_message",
}

export async function handleUrlQuery(payload: {
  params: IZotloCheckoutParams;
  config: FormConfig;
}) {
  const { params, config } = payload || {};
  const queryString = globalThis?.location?.search || "";
  const urlParams = new URLSearchParams(queryString);
  const queryParams = Object.fromEntries(urlParams?.entries());
  const status = config.cardUpdate
    ? queryParams?.[UrlQuery.CARD_STATUS]
    : queryParams?.[UrlQuery.STATUS];
  const errorMessage = queryParams?.[UrlQuery.ERROR_MESSAGE] || "";

  if (status === PaymentCallbackStatus.SUCCESS) {
    const container = document.getElementById(ZOTLO_GLOBAL.containerId);
    const paymentDetail = await handlePaymentSuccess.bind({ container })({ config, params });
    if (paymentDetail) createPaymentSuccessForm({ config, paymentDetail });
  }

  if (status === PaymentCallbackStatus.FAIL) {
    params.events?.onFail?.({ message: errorMessage, data: {} });
  }
}
