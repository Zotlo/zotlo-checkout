/**
 * Country specific rules of the dLocal identity (tax / ID number) input.
 * A new country is supported by adding one object of this shape to DLOCAL_IDENTITY_RULES.
 */
export interface DLocalIdentityRule {
  /** Document acronyms do not change with language (CPF/CNPJ, DNI/CUIT/CUIL). Without it the label comes from localization. */
  label?: string;
  maxLength: number;
  inputMode: 'text' | 'numeric';
  /** Value sent to the backend as identityCardNumber. */
  normalize(value: string): string;
  /** Applies the mask while typing. */
  format(value: string): string;
  isValid(value: string): boolean;
}
