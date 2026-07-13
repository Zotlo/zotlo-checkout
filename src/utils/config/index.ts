import type { ApiResponse } from '../api';

export * from './getCardConfig';
export * from './getCheckoutConfig';

export const ErrorHandler = {
  response: null as ApiResponse | null,
};
