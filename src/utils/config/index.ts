import { ApiRequestError, type ApiResponse } from '../api';
import { Logger, toCapturableError } from '../../lib/logger';
import { ErrorCodes } from './types';

export * from './getCardConfig';
export * from './getCheckoutConfig';

export const ErrorHandler = {
  response: null as ApiResponse | null,
};

// Only backend responses drive the error page. A request that got no response
// (ApiRequestError) or a runtime error has no meta and would break its rendering,
// so the form is left as it is, as when network errors rejected with "".
export function setErrorResponse(e: any) {
  if (e?.meta) ErrorHandler.response = e;
}

const REQUEST_ERROR_CODES: Record<ApiRequestError['type'], string> = {
  network: ErrorCodes.NETWORK_ERROR,
  timeout: ErrorCodes.REQUEST_TIMEOUT,
  abort: ErrorCodes.REQUEST_ABORTED,
};

// onError is documented to receive the backend response. A request that got no response
// (ApiRequestError) or a runtime error has no meta, so it's given the same shape instead of
// leaking the internal error object; integrations reading error.meta.errorCode keep working.
export function toErrorResponse(e: any): ApiResponse {
  if (e?.meta) return e;

  const requestError = e instanceof ApiRequestError ? e : null;
  return {
    meta: {
      requestId: '',
      httpStatus: requestError?.status || 0,
      errorCode: requestError ? REQUEST_ERROR_CODES[requestError.type] : ErrorCodes.SDK_ERROR,
      message: (typeof e === 'string' ? e : e?.message) || 'Unknown error',
    },
    result: {},
  };
}

// Init errors caused by a stale session Uuid, recoverable by dropping the session
export const SESSION_ERROR_CODES = [ErrorCodes.USER_NOT_FOUND, ErrorCodes.USER_NOT_EXIST];

export function isSessionError(response?: ApiResponse | null) {
  return SESSION_ERROR_CODES.includes(response?.meta?.errorCode || '');
}

// Other init rejections (unknown package, checkout link or payment type) are integration
// setup issues rather than SDK failures, so they're reported as warnings
export function captureInitError(e: any) {
  const isSetupError = !!e?.meta?.errorCode && !isSessionError(e);
  Logger.captureException(
    toCapturableError(e),
    isSetupError ? { captureContext: { level: 'warning' } } : undefined
  );
}
