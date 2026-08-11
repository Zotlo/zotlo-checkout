import type { FormConfig } from "../lib/types";

function addAlphaToHex(hex: string, alpha: number) {
  // Remove the '#' if present
  const cleanHex = hex.replace('#', '');

  // Clamp the percentage to 0-100, convert to a 0-255 range, then to hex
  const clampedAlpha = Math.min(100, Math.max(0, alpha));
  const alphaHex = Math.round((clampedAlpha / 100) * 255)
      .toString(16)
      .padStart(2, '0') // Ensures it is always 2 digits (e.g., '0a' instead of 'a')
      .toUpperCase();

  return `#${cleanHex}${alphaHex}`;
}

export function createStyle(config: FormConfig) {
  const { design, success, postPaymentOffers } = config;
  const acceptButton = postPaymentOffers?.acceptButton;
  const declineButton = postPaymentOffers?.declineButton;
  const {
    fontFamily, backgroundColor, borderColor,
    borderRadius, borderWidth, label
  } = design || {}

  const opacity = config.design.darkMode ? '4A' : '1A';
  const priceCardText = design?.priceCard?.textStyle;
  const priceCardDescription = design?.priceCard?.descriptionText;
  const priceCardDefaultColor = config.design.darkMode ? '#FFFFFF' : '#0D0626';

  return design ? `
.zotlo-checkout${config.cardUpdate ? '[data-type="card"]' : ''} {
  --zc-color: ${config.design.darkMode ? '#FFFFFF' : '#000000'};
  --zc-fontFamily: ${fontFamily || 'inherit'};
  --zc-form-backgroundColor: ${backgroundColor || '#FFFFFF'};
  --zc-form-borderRadius: ${borderRadius || '8'}px;
  --zc-form-borderWidth: ${borderWidth || '1'}px;
  --zc-form-borderColor: ${borderColor || '#E7EAEE'};

  --zc-form-input-label-display: ${!label || label?.show ? 'block' : 'none'};
  --zc-form-input-label-color: ${label?.color || '#000000'};
  --zc-form-input-label-fontSize: ${label?.fontSize || '14'}px;
  --zc-form-input-label-fontWeight: ${!label?.textStyle || label?.textStyle.bold ? '500' : 'normal'};
  --zc-form-input-label-fontStyle: ${label?.textStyle.italic ? 'italic' : 'normal'};
  --zc-form-input-label-textDecoration: ${label?.textStyle.underline ? 'underline' : 'none'};

  --zc-form-consent-color: ${design?.consent?.color || '#000000'};
  --zc-form-consent-fontSize: ${design?.consent?.fontSize || '14'}px;
  --zc-form-consent-fontWeight: ${design?.consent?.textStyle?.bold ? '500' : 'normal'};
  --zc-form-consent-fontStyle: ${design?.consent?.textStyle?.italic ? 'italic' : 'normal'};
  --zc-form-consent-textDecoration: ${design?.consent?.textStyle?.underline ? 'underline' : 'none'};

  --zc-form-totalPrice-color: ${design.totalPriceColor || '#151B26'};

  --zc-form-submit-color: ${design?.button?.color || '#FFFFFF'};
  --zc-form-submit-borderColor: ${design?.button?.borderColor || '#4329CC'};
  --zc-form-submit-backgroundColor: ${design?.button?.backgroundColor || '#4329CC'};
  --zc-form-submit-borderWidth: ${design?.button?.borderWidth || '0'}px;
  --zc-form-submit-borderRadius: ${design?.button?.borderRadius || '8'}px;
  --zc-form-submit-fontWeight: ${!design?.button?.textStyle || design?.button?.textStyle?.bold ? 'bold' : 'normal'};
  --zc-form-submit-fontStyle: ${design?.button?.textStyle?.italic ? 'italic' : 'normal'};
  --zc-form-submit-textDecoration: ${design?.button?.textStyle?.underline ? 'underline' : 'none'};
  --zc-form-submit-hover-color: ${design?.button?.hover?.color || '#FFFFFF'};
  --zc-form-submit-hover-borderColor: ${design?.button?.hover?.borderColor || '#301BA3'};
  --zc-form-submit-hover-backgroundColor: ${design?.button?.hover?.backgroundColor || '#301BA3'};

  --zc-form-card-item-backgroundColor: ${(design?.button?.backgroundColor + '1F') || '#765EF51F'};
  --zc-form-card-item-borderColor: ${design?.button?.backgroundColor || '#765EF5'};
  --zc-form-card-item-color: ${config.design.darkMode ? '#FFFFFF' : '#0D0626'};

  --zc-form-spinner-color: #BBBFFF;

  --zc-tab-button-backgroundColor: ${(design?.button?.backgroundColor + opacity) || '#301BA3'};

  --zc-form-provider-backgroundColor: ${design?.darkMode ? '#FFFFFF' : '#000000'};

  --zc-footer-color: ${design?.footer?.color || '#737380'};
  --zc-footer-fontSize: ${design?.footer?.fontSize || '10'}px;

  --zc-success-color: ${success?.color || '#FFFFFF'};
  --zc-success-button-color: ${success?.button?.color || '#FFFFFF'};
  --zc-success-button-borderColor: ${success?.button?.borderColor || '#4329CC'};
  --zc-success-button-backgroundColor: ${success?.button?.backgroundColor || '#4329CC'};
  --zc-success-button-borderWidth: ${success?.button?.borderWidth || '0'}px;
  --zc-success-button-borderRadius: ${success?.button?.borderRadius || '8'}px;
  --zc-success-button-fontWeight: ${!success?.button?.textStyle || success?.button?.textStyle?.bold ? 'bold' : 'normal'};
  --zc-success-button-fontStyle: ${success?.button?.textStyle?.italic ? 'italic' : 'normal'};
  --zc-success-button-textDecoration: ${success?.button?.textStyle?.underline ? 'underline' : 'none'};
  --zc-success-button-hover-color: ${success?.button?.hover?.color || '#FFFFFF'};
  --zc-success-button-hover-borderColor: ${success?.button?.hover?.borderColor || '#301BA3'};
  --zc-success-button-hover-backgroundColor: ${success?.button?.hover?.backgroundColor || '#301BA3'};

  --zc-offer-info-color: ${acceptButton?.backgroundColor || '#765EF5'};
  --zc-offer-info-backgroundColor: ${addAlphaToHex(acceptButton?.backgroundColor || '#765EF5', 15)};

  --zc-offer-title-color: ${postPaymentOffers?.title?.color || '#1A1822'};
  --zc-offer-title-fontSize: ${postPaymentOffers?.title?.fontSize || '19'}px;
  --zc-offer-subtitle-color: ${postPaymentOffers?.subtitle?.color || '#1A1822'};
  --zc-offer-subtitle-fontSize: ${postPaymentOffers?.subtitle?.fontSize || '14'}px;
  --zc-offer-description-color: ${postPaymentOffers?.description?.color || '#1A1822'};
  --zc-offer-description-fontSize: ${postPaymentOffers?.description?.fontSize || '14'}px;
  --zc-offer-priceText-color: ${postPaymentOffers?.priceText?.color || '#1A1822'};
  --zc-offer-priceText-fontSize: ${postPaymentOffers?.priceText?.fontSize || '14'}px;

  --zc-offer-acceptButton-color: ${acceptButton?.color || '#FFFFFF'};
  --zc-offer-acceptButton-backgroundColor: ${acceptButton?.backgroundColor || '#765EF5'};
  --zc-offer-acceptButton-borderRadius: ${acceptButton?.borderRadius || '8'}px;
  --zc-offer-acceptButton-fontSize: ${acceptButton?.fontSize || '14'}px;

  --zc-offer-declineButton-color: ${declineButton?.color || '#1A1822'};
  --zc-offer-declineButton-fontSize: ${declineButton?.fontSize || '10'}px;

  --zc-priceCard-backgroundColor: ${addAlphaToHex(design?.priceCard?.backgroundColor ?? '#F6F7F9', design?.priceCard?.backgroundOpacity ?? 100)};
  --zc-priceCard-borderColor: ${design?.priceCard?.borderColor ?? '#E7EAEE'};
  --zc-priceCard-borderWidth: ${design?.priceCard?.borderWidth ?? 1}px;
  --zc-priceCard-borderRadius: ${design?.priceCard?.borderRadius ?? 8}px;
  --zc-priceCard-secondaryColor: #818A9C;
  --zc-priceCard-defaultColor: ${priceCardDefaultColor};
  --zc-priceCard-description-color: ${priceCardDescription?.color ?? priceCardDefaultColor};
  --zc-priceCard-description-fontSize: ${priceCardDescription?.fontSize ?? 12}px;
  --zc-priceCard-description-fontWeight: ${priceCardDescription?.style?.bold ? '700' : '500'};
  --zc-priceCard-description-fontStyle: ${priceCardDescription?.style?.italic ? 'italic' : 'normal'};
  --zc-priceCard-description-textDecoration: ${priceCardDescription?.style?.underline ? 'underline' : 'none'};
  --zc-priceCard-trialText-fontSize: ${priceCardText?.trialText?.fontSize ?? 12}px;
  --zc-priceCard-trialText-color: ${priceCardText?.trialText?.color ?? priceCardDefaultColor};
  --zc-priceCard-trialPrice-fontSize: ${priceCardText?.trialPrice?.fontSize ?? 14}px;
  --zc-priceCard-trialPrice-color: ${priceCardText?.trialPrice?.color ?? priceCardDefaultColor};
  --zc-priceCard-period-fontSize: ${priceCardText?.period?.fontSize ?? 12}px;
  --zc-priceCard-period-color: ${priceCardText?.period?.color ?? priceCardDefaultColor};
  --zc-priceCard-period-subtextColor: ${addAlphaToHex(priceCardText?.period?.color ?? priceCardDefaultColor, 50)};
  --zc-priceCard-price-fontSize: ${priceCardText?.price?.fontSize ?? 14}px;
  --zc-priceCard-price-color: ${priceCardText?.price?.color ?? priceCardDefaultColor};
}` : '';
}
