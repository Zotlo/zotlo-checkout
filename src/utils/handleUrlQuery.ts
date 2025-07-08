import { createPaymentSuccessForm } from "../lib/create";
import { FormConfig, type IZotloCheckoutParams, PaymentCallbackStatus } from "../lib/types";
import { handlePaymentSuccess } from "./sendPayment";

export enum UrlQuery {
  STATUS = "zc_status",
  ERROR_MESSAGE = "zc_error_message",
}

export async function handleUrlQuery(payload: {
  params: IZotloCheckoutParams;
  config: FormConfig;
  containerId: string;
}) {
  const { params, config, containerId } = payload || {};
  const queryString = globalThis?.location?.search || "";
  const urlParams = new URLSearchParams(queryString);
  const queryParams = Object.fromEntries(urlParams?.entries());
  const status = queryParams?.[UrlQuery.STATUS] || "";
  const errorMessage = queryParams?.[UrlQuery.ERROR_MESSAGE] || "";

  if (status === PaymentCallbackStatus.SUCCESS) {
    const paymentDetail = await handlePaymentSuccess({ params });
    if (paymentDetail) createPaymentSuccessForm({ containerId, config, paymentDetail });
  }

  if (status === PaymentCallbackStatus.FAIL) {
    params.events?.onFail?.({ message: errorMessage, data: {} });
  }
}
