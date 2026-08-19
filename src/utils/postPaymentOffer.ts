import { getActivePostPaymentOffer, setFormLoading, ZOTLO_GLOBAL } from "./index";
import type { FormConfig, IZotloCardParams, IZotloCheckoutParams, OffersObject, PaymentDetail } from "../lib/types";
import { createPostPaymentOffersPage } from "../lib/create";
import { endPaymentSession, getPaymentDetail } from "./sendPayment";
import { CheckoutAPI } from "./api";
import { Logger } from "../lib/logger";

/**
 * Sends the user's decision for a post payment offer.
 *
 * The response uses the same envelope as /payment/checkout, but the offer is
 * charged synchronously (no 3DS redirect), so success is simply the absence of
 * an error code. The XHR layer resolves on 4xx/5xx too, hence the manual check.
 *
 * Errors are reported through onOfferFail rather than onFail: the payment itself
 * already succeeded at this point, only the offer did not go through.
 */
export async function sendOfferDecision(payload: {
  offer: OffersObject;
  decision: boolean;
  params: IZotloCheckoutParams | IZotloCardParams;
}) {
  const { offer, decision, params } = payload;

  try {
    const response = await CheckoutAPI.post('/payment/offer', {
      offerId: offer.offerId,
      decision
    });

    if (response?.meta?.errorCode) {
      params.events?.onOfferFail?.({ message: response.meta?.message, data: offer });
      Logger.client?.captureException(response.meta);
      return false;
    }

    return true;
  } catch (e: any) {
    // Network / timeout, same message fallback shape as the payment requests
    params.events?.onOfferFail?.({
      message: e?.meta?.message || 'Post payment offer request failed',
      data: offer
    });
    Logger.client?.captureException(e);
    return false;
  }
}

/**
 * Renders the post payment offers page and takes over the rest of the success
 * flow: it closes the payment session once the user decides, then hands control
 * back through onComplete so the success page can be shown.
 *
 * Returns false when there is nothing to offer or the page could not be
 * mounted, in which case the caller keeps the original flow.
 */
export function handlePostPaymentOffers(payload: {
  config: FormConfig;
  params: IZotloCheckoutParams | IZotloCardParams;
  paymentDetail: PaymentDetail;
  onComplete: (paymentDetail: PaymentDetail) => Promise<void>;
}) {
  const { config, params, paymentDetail, onComplete } = payload;
  const activeOffer = getActivePostPaymentOffer({ config, paymentDetail });

  if (!activeOffer) return false;

  /** The success page renders the accepted offers off the refetched detail */
  const acceptedOfferIds: number[] = [];

  /** Closes the payment session and hands the rest of the success flow back to the caller */
  async function finishOffers() {
    // Offer transactions are only served by a fresh payment detail, and a single
    // fetch covers every accepted offer. getPaymentDetail reports its own
    // backend errors, so a reject here is only worth recording.
    const detail = acceptedOfferIds.length
      ? await getPaymentDetail(params).catch((e) => {
        Logger.client?.captureException(e);
        return null;
      })
      : null;

    endPaymentSession({ config, params });
    setFormLoading(false);

    await onComplete(detail || paymentDetail);
  }

  /**
   * Renders one offer and owns its decision. Offers are paired with their
   * settings by position, so presenting a following offer is only a new call
   * with the next index.
   */
  function presentOffer(offerIndex: number) {
    const offer = paymentDetail?.offers?.[offerIndex];

    if (!offer) return false;
    if (!createPostPaymentOffersPage({ config, paymentDetail, offerIndex })) return false;

    const form = ZOTLO_GLOBAL.formElement;
    const acceptButton = form?.querySelector('[data-offer-accept]') as HTMLButtonElement;
    const declineButton = form?.querySelector('[data-offer-decline]') as HTMLButtonElement;

    // Without both actions the user could never leave this screen
    if (!acceptButton || !declineButton) return false;

    let isDeciding = false;

    function destroyOfferEvents() {
      acceptButton.removeEventListener('click', handleAccept);
      declineButton.removeEventListener('click', handleDecline);
    }

    /** Locks the screen synchronously, before the browser can paint a second click */
    function lockOfferActions() {
      destroyOfferEvents();
      acceptButton.disabled = true;
      declineButton.disabled = true;
      setFormLoading(true);
    }

    // Both decisions end the flow for now. Presenting the offers one after
    // another means calling presentOffer(offerIndex + 1) here instead, and
    // falling back to finishOffers() once no offer is left.
    async function handleAccept() {
      if (isDeciding) return;
      isDeciding = true;
      lockOfferActions();

      const isSuccessful = await sendOfferDecision({ offer: offer!, decision: true, params });

      // The base payment already went through, so a failed offer must never
      // strand the user on this screen.
      if (isSuccessful) acceptedOfferIds.push(offer!.offerId);

      return finishOffers();
    }

    async function handleDecline() {
      if (isDeciding) return;
      isDeciding = true;
      lockOfferActions();

      await sendOfferDecision({ offer: offer!, decision: false, params });

      return finishOffers();
    }

    acceptButton.addEventListener('click', handleAccept);
    declineButton.addEventListener('click', handleDecline);

    return true;
  }

  return presentOffer(activeOffer.index);
}
