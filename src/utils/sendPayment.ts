import { PaymentProvider, PaymentResultStatus, type IZotloCheckoutParams } from "../lib/types";
import { API } from "./api";

function preparePayload(providerKey: PaymentProvider, formData: Record<string, any>, params: IZotloCheckoutParams) {
  const { cardExpiration, acceptPolicy, cardNumber, cardHolder, cardCVV } = formData || {};
  const { returnUrl } = params || {};
  const [cardExpirationMonth, cardExpirationYear] = cardExpiration?.split("/") || [];
  let payload = {};

  switch (providerKey) {
    case PaymentProvider.PAYPAL:
      payload = {
        providerKey,
        acceptPolicy,
      }
      break;
    case PaymentProvider.CREDIT_CARD:
      payload = {
        providerKey,
        acceptPolicy,
        creditCardDetails: {
          cardHolder,
          cardNumber: cardNumber?.replace(/\s/g, '') || '',
          cardExpirationMonth,
          cardExpirationYear: `20${cardExpirationYear}`,
          cardCVV,
        }
      }
      break;
    case PaymentProvider.GOOGLE_PAY:
    case PaymentProvider.APPLE_PAY:
    default:
      break;
  }
  
  return {
    ...payload,
    ...(returnUrl && { returnUrl }),
  }
}

async function registerPaymentUser(subscriberId: string) {
  try {
    if (!subscriberId) return null;
    const response = await API.post("/payment/register", { subscriberId });
    return response;
  } catch {
    return null;
  }
}

export async function sendPayment(providerKey: PaymentProvider, formData: Record<string, any>, params: IZotloCheckoutParams) {
  try {
    const { subscriberId = "" } = formData || {};

    // Register user
    await registerPaymentUser(subscriberId);
    
    // Send payment
    const payload = preparePayload(providerKey, formData, params);
    const { meta, result } = await API.post("/payment/checkout", payload);

    if (meta?.errorCode) return params.events?.onFail?.({ message: meta?.message, data: meta });

    if (meta.httpStatus === 200) {
      const { status, redirectUrl, payment } = result || {};
      if (status === PaymentResultStatus.REDIRECT && !!redirectUrl && globalThis?.location?.href) {
        globalThis.location.href = redirectUrl;
      }
      if (status === PaymentResultStatus.COMPLETE && payment) {
        params.events?.onSuccess?.();
      }
    }
  } catch (err:any) {
    params.events?.onFail?.({ message: err?.meta?.message, data: err?.meta });
  }
}
