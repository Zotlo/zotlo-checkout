import { handleResponseRedirection } from "./index";
import { Logger } from "../lib/logger";
import { type FormConfig, type IZotloCardParams } from "../lib/types";
import { CardAPI } from "./api";
import { COOKIE } from "./cookie";

function preparePayload(payload: {
  formData: Record<string, any>;
  params: IZotloCardParams;
}) {
  const { formData, params } = payload;
  const { returnUrl } = params || {};
  const { cardExpiration, cardNumber, cardHolder, cardCVV } = formData || {};
  const [cardExpirationMonth, cardExpirationYear] = cardExpiration?.split("/") || [];

  return {
    creditCardDetails: {
      cardHolder,
      cardNumber: cardNumber?.replace(/\s/g, '') || '',
      cardExpirationMonth,
      cardExpirationYear: `20${cardExpirationYear}`,
      cardCVV,
    },
    ...(returnUrl && { returnUrl }),
    ...(import.meta.env.DEV && { developmentForce3DS: true })
  }
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

  if (meta.httpStatus >= 200 && meta.httpStatus < 400) {
    await handleResponseRedirection({
      response: cardResponse,
      params,
      sessionKey: COOKIE.CARD_UUID
    });
  }
}

export async function updateCard(payload: {
  formData: Record<string, any>;
  config: FormConfig;
  params: IZotloCardParams;
}) {
  const { formData, config, params } = payload;
  try {
    const updatePayload = preparePayload({ formData, params });
    const reqConfig = { headers: { Language: config.general.language } };
    const cardResponse = await CardAPI.post('/card/update', updatePayload, reqConfig);
    await handleCardResponse({ cardResponse, params });
    return cardResponse;
  } catch (err: any) {
    params.events?.onFail?.({ message: err?.meta?.message, data: err?.meta });
    Logger.client?.captureException(err);
  }
}
