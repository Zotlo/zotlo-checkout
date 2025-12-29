import { handleResponseRedirection } from "./index";
import { Logger } from "../lib/logger";
import { type FormConfig, type IZotloCardParams, PaymentProvider } from "../lib/types";
import { CardAPI } from "./api";
import { COOKIE } from "./cookie";

function preparePayload(payload: {
  providerKey: PaymentProvider;
  formData: Record<string, any>;
  params: IZotloCardParams;
}) {
  const { providerKey, formData, params } = payload;
  const { returnUrl } = params || {};
  const { cardExpiration, cardNumber, cardHolder, cardCVV } = formData || {};
  const [cardExpirationMonth, cardExpirationYear] = cardExpiration?.split("/") || [];

  let data = {
    providerKey,
    creditCardDetails: {
      cardHolder,
      cardNumber: cardNumber?.replace(/\s/g, '') || '',
      cardExpirationMonth,
      cardExpirationYear: `20${cardExpirationYear}`,
      cardCVV,
    }
  }

  return {
    ...data,
    ...(returnUrl && { returnUrl }),
  };
}

async function handleCardResponse(payload: {
  cardResponse: Record<string, any>;
  params: IZotloCardParams;
}) {
  const { cardResponse, params } = payload;
  const { meta } = cardResponse || {};
  if (meta?.errorCode) {
    return params.events?.onFail?.({ message: meta?.message, data: meta });
  }

  if (meta.httpStatus === 200) {
    handleResponseRedirection({
      response: cardResponse,
      params,
      sessionKey: COOKIE.CARD_UUID
    });
  }
}

export async function updateCard(payload: {
  providerKey: PaymentProvider;
  formData: Record<string, any>;
  config: FormConfig;
  params: IZotloCardParams;
}) {
  const { providerKey, formData, config, params } = payload;
  try {
    const updatePayload = preparePayload({ providerKey, formData, params });
  
    // Update card
    const reqConfig = { headers: { Language: config.general.language } };
    const cardResponse = await CardAPI.post('/card/update', updatePayload, reqConfig);
    handleCardResponse({ cardResponse, params });
    return cardResponse;
  } catch (err: any) {
    params.events?.onFail?.({ message: err?.meta?.message, data: err?.meta });
    Logger.client?.captureException(err);
  }
}
