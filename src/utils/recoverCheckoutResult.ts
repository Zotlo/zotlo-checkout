import { type PaymentDetail, type TransactionDetail, PaymentProvider, PaymentResultStatus, PaymentCallbackStatus } from "../lib/types";
import { ApiRequestError, CheckoutAPI, type ApiResponse } from "./api";
import { UrlQuery } from "./handleUrlQuery";
import { Logger } from "../lib/logger";

// /payment/detail is asked this many times, this far apart, before the checkout
// is given up as failed. The backend finishes a wallet checkout in under 10 s.
const LOOKUP_ATTEMPTS = 3;
const LOOKUP_DELAY_MS = 3000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface CheckoutLookup {
  providerKey: PaymentProvider;
  // Known before the checkout for wallet payments (from /payment/init), not for cards
  transactionId?: string;
  returnUrl?: string;
}

// The checkout request got no response, but the page is still there to receive one:
// the backend may well have completed the payment (nginx 499: it answered in 7-10 s,
// the browser reported a network error seconds to minutes later)
export function isCheckoutResultUnknown(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
    && error.type !== 'abort'
    && !error.unloading
    && error.online;
}

function findTransaction(detail: PaymentDetail | null | undefined, lookup: CheckoutLookup) {
  const transactions = detail?.transaction || [];
  if (!transactions.length) return null;

  // /payment/detail lists only completed payments; a wallet payment is matched by the
  // transactionId it was started with, a card payment by its provider (the session ends
  // with the first successful payment, so an older one cannot be lying around in it)
  if (lookup.transactionId) {
    const byId = transactions.find((t) => t.transaction_id === lookup.transactionId);
    if (byId) return { transaction: byId, matchedBy: 'transactionId' as const };
  }
  const byProvider = transactions.find((t) => t.provider_key === lookup.providerKey);
  if (byProvider) return { transaction: byProvider, matchedBy: 'provider' as const };

  return null;
}

// The success URL the backend sends with a completed checkout (and after a 3D Secure
// return): the merchant page reads zc_status and transactionId from it (handleUrlQuery),
// the other fields are there for the merchant's own tracking
function buildSuccessUrl(returnUrl: string | undefined, detail: PaymentDetail, transaction: TransactionDetail) {
  if (!returnUrl) return '';
  try {
    const url = new URL(returnUrl, globalThis?.location?.href);
    const query: Record<string, string> = {
      [UrlQuery.STATUS]: PaymentCallbackStatus.SUCCESS,
      success: '1',
      method: transaction.provider_key || '',
      country: transaction.country || '',
      packageType: transaction.payment_type || '',
      language: detail?.client?.language || '',
      transactionId: transaction.transaction_id,
    };
    Object.entries(query).forEach(([key, value]) => { if (value) url.searchParams.set(key, value); });
    return url.toString();
  } catch {
    return '';
  }
}

/**
 * Asks /payment/detail whether the payment the browser got no answer for went through,
 * so the user is not told it failed (and does not pay again) when it did. The session
 * is still the one the payment was made in: it is only dropped once a payment succeeds.
 * Resolves to a checkout-like COMPLETE response, or null when no payment was recorded.
 */
export async function recoverCheckoutResult(payload: {
  lookup: CheckoutLookup;
  error: ApiRequestError;
  startedAt: number;
}): Promise<ApiResponse | null> {
  const { lookup, error, startedAt } = payload;

  for (let attempt = 0; attempt < LOOKUP_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(LOOKUP_DELAY_MS);

    let response: ApiResponse;
    try {
      // A renewed session would not know this payment, so never swap the session here
      response = await CheckoutAPI.get('/payment/detail', { renewSession: false });
    } catch (e) {
      // Still no network: the next attempt may get through
      if (e instanceof ApiRequestError) continue;
      throw e;
    }

    // Not registered, session expired, or any other refusal: nothing more to learn here
    if (response?.meta?.errorCode) return null;

    const detail = response?.result as PaymentDetail;
    const match = findTransaction(detail, lookup);
    if (!match) continue;

    const { transaction, matchedBy } = match;
    Logger.captureException(new Error('Checkout result recovered from /payment/detail'), {
      captureContext: {
        level: 'warning',
        tags: { provider: lookup.providerKey, matchedBy },
        extra: {
          attempt,
          elapsedMs: Date.now() - startedAt,
          checkoutError: { type: error.type, status: error.status, elapsedMs: error.elapsedMs, clientRequestId: error.clientRequestId },
          transactionId: transaction.transaction_id,
          purchaseDate: transaction.original_purchase_date,
        }
      }
    });

    return {
      meta: { requestId: response.meta.requestId, httpStatus: 200 },
      result: {
        status: PaymentResultStatus.COMPLETE,
        transactionId: transaction.transaction_id,
        payment: { returnUrl: buildSuccessUrl(lookup.returnUrl, detail, transaction) },
        recovered: true,
      }
    };
  }

  return null;
}
