import { type IZotloCheckoutParams, PaymentCallbackStatus } from "../lib/types";

export enum UrlQuery {
  STATUS = "zc_status",
}

export function handleUrlQuery(params:IZotloCheckoutParams ) {
  const queryString = globalThis?.location?.search || "";
  const urlParams = new URLSearchParams(queryString);
  const queryParams = Object.fromEntries(urlParams?.entries());
  const status = queryParams?.[UrlQuery.STATUS] || "";

  if (status === PaymentCallbackStatus.SUCCESS) {
    params.events?.onSuccess?.();
  }

  if (status === PaymentCallbackStatus.FAIL) {
    params.events?.onFail?.();
  }
}