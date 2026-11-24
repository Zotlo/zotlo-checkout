interface InputMaskOptions {
  /** A single mask, or several alternatives (e.g. phone formats of a country) picked by the typed value. */
  mask: string | string[];
  maskChar?: string;
  validChars?: RegExp;
}

type MaskMatch = {
  mask: string;
  /** Masked output */
  value: string;
  /** Every value char found a place in the mask */
  consumed: boolean;
  /** A fixed digit in the mask (e.g. the 8 of "(8##)") differs from the typed digit */
  mismatch: boolean;
  /** Fixed digits in the mask that the typed digits matched */
  matchedLiterals: number;
  /** Digits the mask holds: placeholders plus fixed digits */
  slots: number;
};

function matchMask(mask: string, value: string, validChars: RegExp = /\d/): MaskMatch {
  let maskedValue = '';
  let valueIndex = 0;
  let mismatch = false;
  let matchedLiterals = 0;

  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    const maskChar: string = mask[i];
    const valueChar: string = value[valueIndex];

    if (maskChar === '#') {
      if (validChars.test(valueChar)) {
        maskedValue += valueChar;
        valueIndex++;
      }
    } else {
      maskedValue += maskChar;

      // If the mask character is a placeholder, we need to skip the value character
      if (valueChar === maskChar) {
        valueIndex++;
        if (/\d/.test(maskChar)) matchedLiterals++;
      } else if (/\d/.test(maskChar) && /\d/.test(valueChar)) {
        mismatch = true;
      }
    }
  }

  return {
    mask,
    value: maskedValue,
    consumed: valueIndex >= value.length,
    mismatch,
    matchedLiterals,
    slots: (mask.match(/[#\d]/g) || []).length
  };
}

/**
 * Picks the mask that fits the value among alternatives:
 * 1. Masks that hold the whole value without contradicting their fixed digits,
 *    the most specific one first (e.g. "(8##)###-###" for a value starting with 8), then the shortest.
 * 2. Otherwise the shortest mask that holds the whole value.
 * 3. Otherwise the longest mask (value gets truncated).
 */
function resolveMask(masks: string[], value: string, validChars: RegExp = /\d/): MaskMatch {
  const matches = masks.map((mask, index) => ({ index, ...matchMask(mask, value, validChars) }));
  const bySize = [...matches].sort((a, b) => a.slots - b.slots || a.index - b.index);
  const bySpecificity = [...bySize].sort((a, b) => b.matchedLiterals - a.matchedLiterals);

  return bySpecificity.find((item) => item.consumed && !item.mismatch)
    ?? bySize.find((item) => item.consumed)
    ?? bySize[bySize.length - 1];
}

/** True when the digits fill one of the masks completely without contradicting its fixed digits. */
function isMaskComplete(masks: string[], digits: string): boolean {
  return masks.some((mask) => {
    const match = matchMask(mask, digits);
    return match.consumed && !match.mismatch && digits.length === match.slots;
  });
}

type IMaskInputOnInput = {
  name: string,
  value: string,
  mask: InputMask,
  updateValue: (value?: string) => string
}

class InputMask {
  private options: Required<InputMaskOptions>;

  constructor(options: InputMaskOptions) {
    this.options = {
      mask: options.mask,
      maskChar: options.maskChar || '',
      validChars: options.validChars || /\d/
    };
  }

  public isRegexMask(): boolean {
    const { mask } = this.options;
    return typeof mask === 'string' && mask.startsWith('/') && /\/(g?m?d?i?y?s?u?v?)?$/.test(mask);
  }

  public apply(value: string): string {
    const { mask, validChars } = this.options;

    if (Array.isArray(mask)) {
      if (!mask.length) return value;
      return resolveMask(mask, value, validChars).value;
    }

    if (this.isRegexMask()) {
      let stringPattern = mask.slice(1);
      const endOfPattern = stringPattern.match(/\/(g?m?d?i?y?s?u?v?)?$/)?.[0];
      if (endOfPattern) {
        stringPattern = stringPattern.replace(new RegExp(endOfPattern+'$'), '');
      }
      const regex = new RegExp(stringPattern);
      if (regex.test(value)) return value;
      return value.slice(0, -1);
    }

    return matchMask(mask, value, validChars).value;
  }

  public updateOptions(options: InputMaskOptions) {
    this.options = {
      ...this.options,
      ...options
    }
  }
}

function maskInput(
  inputElement: HTMLInputElement,
  options: InputMaskOptions & {
    onInput?: (payload: IMaskInputOnInput) => void,
    /** Custom formatter that replaces the default digit-only masking (e.g. alphanumeric CNPJ). */
    format?: (value: string) => string
  }
) {
  if (!inputElement) throw new Error('Element not found');

  let mask = new InputMask(options);

  function updateFormattedValue(val?: string) {
    const oldValue = val || inputElement.value;
    const caret = inputElement.selectionStart ?? oldValue.length;
    const charsBeforeCaret = oldValue.slice(0, caret).replace(/[^0-9A-Za-z]/g, '').length;
    const maskedValue = options.format!(oldValue);
    inputElement.value = maskedValue;

    // Keep the caret after the same number of characters when editing in the middle
    if (document.activeElement === inputElement && caret < oldValue.length) {
      let pos = 0;
      let count = 0;
      while (pos < maskedValue.length && count < charsBeforeCaret) {
        if (/[0-9A-Za-z]/.test(maskedValue[pos])) count++;
        pos++;
      }
      inputElement.setSelectionRange(pos, pos);
    }
    return maskedValue;
  }

  function updateValue(val?: string) {
    if (options.format) return updateFormattedValue(val);
    const tempVal = val || inputElement.value;
    const value = mask.isRegexMask() ? tempVal : tempVal.replace(/\D/g, ''); // Remove non-digits
    const maskedValue = mask.apply(value);
    inputElement.value = maskedValue;
    return maskedValue
  }

  function handleInput() {
    const value = updateValue();
    options.onInput?.({
      name: inputElement.name,
      value,
      mask,
      updateValue
    });
  }

  // Strip punctuation on paste: maxlength would otherwise cut a formatted value
  // (e.g. "20.123.456.786.") before the formatter can clean it up.
  function handlePaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text');
    if (text == null) return;
    event.preventDefault();
    const cleaned = text.replace(/[^0-9A-Za-z]/g, '');
    const { value } = inputElement;
    const start = inputElement.selectionStart ?? value.length;
    const end = inputElement.selectionEnd ?? value.length;
    inputElement.value = value.slice(0, start) + cleaned + value.slice(end);
    const caret = start + cleaned.length;
    inputElement.setSelectionRange(caret, caret);
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }

  inputElement.addEventListener('input', handleInput);
  if (options.format) inputElement.addEventListener('paste', handlePaste);

  function destroy() {
    inputElement.removeEventListener('input', handleInput);
    inputElement.removeEventListener('paste', handlePaste);
    mask = null as any;
  }

  return {
    mask,
    updateValue,
    destroy
  }
}

// Export the types and class
export { maskInput, InputMask, isMaskComplete, type InputMaskOptions, type IMaskInputOnInput };
