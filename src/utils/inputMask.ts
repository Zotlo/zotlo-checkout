interface InputMaskOptions {
  mask: string;
  maskChar?: string;
  validChars?: RegExp;
}

class InputMask {
  private readonly options: Required<InputMaskOptions>;

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
      
      if (maskChar === '#') {
        if (this.options.validChars.test(value[valueIndex])) {
          maskedValue += value[valueIndex];
          valueIndex++;
        }

        /* if (valueIndex < value.length) {
          if (this.options.validChars.test(value[valueIndex])) {
            maskedValue += value[valueIndex];
            valueIndex++;
          }
        } else {
          maskedValue += this.options.maskChar;
        } */
      } else {
        maskedValue += maskChar;
      }
    }

    return maskedValue;
  }
}

function maskInput(inputElement: HTMLInputElement, options: InputMaskOptions) {
  if (!inputElement) throw new Error('Element not found');

  let mask = new InputMask(options);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.value.replace(/\D/g, ''); // Remove non-digits
    target.value = mask.apply(value);
  }

  inputElement.addEventListener('input', handleInput);

  function destroy() {
    inputElement.removeEventListener('input', handleInput);
    mask = null as any;
  }

  return {
    destroy
  }
}

// Export the types and class
export { maskInput, InputMask, type InputMaskOptions };
