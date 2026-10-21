import type { ApiResponse } from '../api';
import { Logger, toCapturableError } from '../../lib/logger';
import { ErrorCodes } from './types';

export * from './getCardConfig';
export * from './getCheckoutConfig';

export const ErrorHandler = {
  response: null as ApiResponse | null,
};

// Init errors caused by a stale session Uuid, recoverable by dropping the session
export const SESSION_ERROR_CODES = [ErrorCodes.USER_NOT_FOUND, ErrorCodes.USER_NOT_EXIST];

export function isSessionError(response?: ApiResponse | null) {
  return SESSION_ERROR_CODES.includes(response?.meta?.errorCode || '');
}

// Other init rejections (unknown package, checkout link or payment type) are integration
// setup issues rather than SDK failures, so they're reported as warnings
export function captureInitError(e: any) {
  const isSetupError = !!e?.meta?.errorCode && !isSessionError(e);
  Logger.client?.captureException(
    toCapturableError(e),
    isSetupError ? { captureContext: { level: 'warning' } } : undefined
  );
}
