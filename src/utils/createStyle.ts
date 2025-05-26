import type { FormConfig } from "../lib/types";

export function createStyle(config: FormConfig) {
  const { design, success } = config;
  const {
    fontFamily, backgroundColor, borderColor,
    borderRadius, borderWidth, label
  } = design || {}

  const opacity = config.design.darkMode ? '4A' : '1A';

  return design ? `
.zotlo-checkout {
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
  --zc-success-button-hover-color: ${success?.button?.hover?.color || '#FFFFFF'};
  --zc-success-button-hover-borderColor: ${success?.button?.hover?.borderColor || '#301BA3'};
  --zc-success-button-hover-backgroundColor: ${success?.button?.hover?.backgroundColor || '#301BA3'};
}` : '';
}
