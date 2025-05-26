import { createPaymentSuccessForm } from "../lib/create";
import { FormConfig, type IZotloCheckoutParams, PaymentCallbackStatus } from "../lib/types";

export enum UrlQuery {
  STATUS = "zc_status",
}

export function handleUrlQuery(payload: {
  params: IZotloCheckoutParams;
  config: FormConfig;
  containerId: string;
}) {
  const { params, config, containerId } = payload || {};
  const queryString = globalThis?.location?.search || "";
  const urlParams = new URLSearchParams(queryString);
  const queryParams = Object.fromEntries(urlParams?.entries());
  const status = queryParams?.[UrlQuery.STATUS] || "";

  if (status === PaymentCallbackStatus.SUCCESS) {
    createPaymentSuccessForm({ containerId, config });
    params.events?.onSuccess?.();
  }

  if (status === PaymentCallbackStatus.FAIL) {
    params.events?.onFail?.();
  }
}