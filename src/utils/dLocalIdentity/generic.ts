// Fallback for countries without specific rules: free alphanumeric input, only required.
import type { DLocalIdentityRule } from './types';

const MAX_LENGTH = 20;

function normalize(value: string) {
  return String(value ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, MAX_LENGTH);
}

export const GENERIC: DLocalIdentityRule = {
  maxLength: MAX_LENGTH,
  inputMode: 'text',
  normalize,
  format: normalize,
  isValid: (value: string) => normalize(value).length > 0,
};
