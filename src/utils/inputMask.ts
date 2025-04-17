interface InputMaskOptions {
  mask: string;
  maskChar?: string;
  validChars?: RegExp;
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

  public apply(value: string): string {
    let maskedValue = '';
    let valueIndex = 0;

    for (let i = 0; i < this.options.mask.length && valueIndex < value.length; i++) {
      const maskChar: string = this.options.mask[i];
      const valueChar: string = value[valueIndex];

      if (maskChar === '#') {
        if (this.options.validChars.test(valueChar)) {
          maskedValue += valueChar;
          valueIndex++;
        }
      } else {
        maskedValue += maskChar;

        // If the mask character is a placeholder, we need to skip the value character
        if (valueChar === maskChar) {
          valueIndex++;
        }
      }
    }

    return maskedValue;
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
    onInput?: (payload: IMaskInputOnInput) => void
  }
) {
  if (!inputElement) throw new Error('Element not found');

  let mask = new InputMask(options);

  function updateValue(val?: string) {
    const value = (val || inputElement.value).replace(/\D/g, ''); // Remove non-digits
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

  inputElement.addEventListener('input', handleInput);

  function destroy() {
    inputElement.removeEventListener('input', handleInput);
    mask = null as any;
  }

  return {
    mask,
    updateValue,
    destroy
  }
}

// Export the types and class
export { maskInput, InputMask, type InputMaskOptions, type IMaskInputOnInput };
