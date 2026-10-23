import type * as Sentry from '@sentry/browser';
import type * as SentryChunk from '../zotlo-sentry';

const SENTRY_CHUNK_FILE = 'zotlo-sentry.min.js';

// Google Pay's pay.js rejects with a plain { statusCode, statusMessage } object
// instead of an Error, which Sentry titles "Object captured as exception with
// keys: statusCode, statusMessage". Convert it so the issue title and grouping
// carry the actual message (e.g. "DEVELOPER_ERROR: currencyCode in
// transactionInfo must be set!").
// It can also reject with a plain string (e.g. "failed to open window"), which
// Sentry records without a stack trace, so wrap strings in an Error as well.
// Backend errors thrown as the raw { meta, result } response (e.g. /init) would all
// group under "Object captured as exception with keys: meta, result", so they're
// titled by their error code; the meta fields are recorded via extraErrorDataIntegration.
export function toCapturableError(err: unknown): unknown {
  if (typeof err === 'string') return new Error(err);
  if (err instanceof Error) return err;

  const response = err as { meta?: { errorCode?: string; message?: string; httpStatus?: number; requestId?: string } } | null;
  if (response?.meta?.errorCode) {
    const { errorCode, message, httpStatus, requestId } = response.meta;
    const error = Object.assign(new Error(`${errorCode}: ${message || ''}`), { errorCode, httpStatus, requestId });
    error.name = 'ApiResponseError';
    return error;
  }

  const e = err as { statusCode?: unknown; statusMessage?: unknown } | null;
  if (!e?.statusMessage) return err;
  const error = new Error(String(e.statusMessage));
  error.name = String(e.statusCode || 'PaymentsError');
  return error;
}

// Fields of ApiRequestError (utils/api.ts) and ApiResponseError (toCapturableError) read
// in beforeSend. Duck-typed: api.ts imports the Logger, so the classes can't be imported here.
interface ApiErrorFields {
  name: string;
  method: string;
  endpoint: string;
  type: string;
  status: number;
  elapsedMs: number;
  unloading: boolean;
  online: boolean;
  visibility: string;
  errorCode: string;
  httpStatus: number;
}

function elapsedBucket(ms?: number) {
  if (typeof ms !== 'number') return 'unknown';
  if (ms < 50) return '<50ms';
  if (ms < 200) return '50-200ms';
  if (ms < 1000) return '200ms-1s';
  if (ms < 5000) return '1-5s';
  if (ms < 15000) return '5-15s';
  return '>15s';
}

// Captured at module evaluation: in iife/umd builds Rollup rewrites import.meta.url
// to document.currentScript.src, which is only reliable during synchronous execution.
const SCRIPT_URL = import.meta.url;

export const Logger = {
  client: undefined as Sentry.BrowserClient | undefined,
  scope: undefined as Sentry.Scope | undefined,

  getSentry() {
    return (window as any)?.__zotloSentry as (typeof SentryChunk | undefined);
  },

  getEnv() {
    if (import.meta.env.MODE === 'development') {
      return 'development';
    }

    if (import.meta.env.MODE === 'rc') {
      return 'staging';
    }

    return 'production';
  },

  getConfig() : ConstructorParameters<typeof Sentry.BrowserClient>[0] {
    const env = this.getEnv();
    const release = `${__APP_NAME__}@${__APP_VERSION__}`;
    const SentryBrowser = this.getSentry() as typeof SentryChunk;

    return {
      dsn: 'https://153957e4d927936b0b109b0bb75dc1ae@o4509214333140992.ingest.de.sentry.io/4510227417923664',
      sendDefaultPii: true,
      environment: env,
      transport: SentryBrowser.makeFetchTransport,
      stackParser: SentryBrowser.defaultStackParser,
      // Only integrations that don't patch page globals — events reach this client
      // solely through explicit Logger.captureException() calls, so nothing
      // from the host page can leak into our project.
      integrations: [
        SentryBrowser.eventFiltersIntegration(),
        SentryBrowser.functionToStringIntegration(),
        SentryBrowser.linkedErrorsIntegration(),
        SentryBrowser.dedupeIntegration(),
        SentryBrowser.httpContextIntegration(),
        // Records custom error fields (e.g. ApiRequestError's elapsedMs/status) as extra data
        SentryBrowser.extraErrorDataIntegration(),
      ],
      // Sentry groups by stack trace, and these errors are always created in the same place
      // (the XHR handler, toCapturableError), so every endpoint or error code would land in
      // a single issue. Group them by request and by error code instead, and expose their
      // fields as tags so the issue stream can be filtered (extra data can't be searched).
      beforeSend(event, hint) {
        const err = hint?.originalException as Partial<ApiErrorFields> | undefined;

        if (err?.name === 'ApiRequestError') {
          const request = `${err.method} ${err.endpoint}`;
          // Safari reports requests cancelled by the user leaving the page as network
          // errors (status 0). Nothing failed and nobody saw it: keep them apart and
          // quiet, but still counted, so real network failures stand out.
          const cancelledByNavigation = err.type !== 'timeout' && !!err.unloading;
          const offline = err.online === false;

          event.tags = {
            ...event.tags,
            'api.request': request,
            'api.type': String(err.type),
            'api.status': String(err.status),
            'api.elapsed': elapsedBucket(err.elapsedMs),
            'api.unloading': String(!!err.unloading),
            'api.online': String(err.online !== false),
            'api.visibility': String(err.visibility),
          };

          if (cancelledByNavigation) {
            event.level = 'info';
            event.fingerprint = ['ApiRequestError', 'cancelled-by-navigation', request];
          } else if (offline) {
            event.level = 'warning';
            event.fingerprint = ['ApiRequestError', 'offline', request];
          } else {
            event.fingerprint = ['ApiRequestError', request];
          }
        }

        if (err?.name === 'ApiResponseError') {
          event.tags = {
            ...event.tags,
            'api.errorCode': String(err.errorCode),
            'api.httpStatus': String(err.httpStatus),
          };
          event.fingerprint = ['ApiResponseError', String(err.errorCode)];
        }

        return event;
      },
      release,
      // Known Error/ad/3rd-party and loop sources (allowUrls defined will probably block these, but let's call it extra security)
      denyUrls: [
        // Browser extensions
        /^(?:chrome|chrome-extension|moz-extension|safari-extension|ms-browser-extension):\/\//i,

        // Common ad / analytics services
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*googletagmanager\.com/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*google-analytics\.com/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*doubleclick\.net/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*facebook(?:\.com|\.net)/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*onesignal\.com/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*hotjar\.com/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*intercomcdn\.com/i,
        // Public CDNs (jsdelivr, unpkg) must not be listed: the SDK itself is served from them,
        // so errors thrown in our own code would be dropped for those integrations
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*browser-intake-datadoghq\.com/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*mixpanel\.com/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*segment\.com/i,

        // Recommended in case of errors in Sentry's own domain (loop prevention)
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*sentry\.io/i
      ],
    }
  },

  getSentryScriptUrls() {
    const urls: string[] = [];

    // Script-tag embeds: the chunk sits next to the SDK script itself.
    // Only trust SCRIPT_URL when it points at one of our own dist files —
    // in bundler builds import.meta.url points at the consumer's bundle,
    // where the chunk doesn't exist and the request would be a wasted 404.
    const isOwnScriptUrl = /^https?:\/\//i.test(SCRIPT_URL)
      && /\/zotlo-(checkout|card)(\.umd\.cjs|(\.min)?\.js)$/i.test(new URL(SCRIPT_URL).pathname);

    if (isOwnScriptUrl) {
      urls.push(new URL(SENTRY_CHUNK_FILE, SCRIPT_URL).toString());
    }

    // Fallback for bundler (npm) consumers and dev, where the chunk isn't
    // reachable relative to the consuming bundle.
    const cdnUrl = `https://cdn.jsdelivr.net/npm/${__APP_NAME__}@${__APP_VERSION__}/dist/${SENTRY_CHUNK_FILE}`;
    if (!urls.includes(cdnUrl)) {
      urls.push(cdnUrl);
    }

    return urls;
  },

  loadScript(src: string) {
    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';

      script.onerror = () => {
        script.remove();
        resolve(false);
      };
      script.onload = () => resolve(true);

      document.head.appendChild(script);
    });
  },

  initSentryOnBrowser() {
    const SentryBrowser = this.getSentry();
    if (!SentryBrowser) return;

    const client = new SentryBrowser.BrowserClient(this.getConfig());
    const scope = new SentryBrowser.Scope();

    // Set client and scope
    scope.setClient(client);

    // initialize client
    client.init();

    // Save references
    this.client = client;
    this.scope = scope;
  },

  // Captures through our scope instead of the client directly: only Scope.captureException
  // puts originalException on the hint, which extraErrorDataIntegration needs to record the
  // error's custom fields (e.g. ApiRequestError's elapsedMs, ApiResponseError's requestId)
  captureException(err: unknown, hint?: Parameters<Sentry.Scope['captureException']>[1]) {
    this.scope?.captureException(err, hint);
  },

  // Wraps an SDK entry point so errors thrown inside it are reported to Sentry
  // before propagating to the caller. This keeps capturing opt-in per function
  // instead of patching page globals (see zotlo-sentry.ts).
  wrap<T extends (...args: any[]) => any>(fn: T): T {
    const capture = (err: unknown) => {
      this.captureException(err);
    };

    return function (this: unknown, ...args: Parameters<T>) {
      try {
        const result = fn.apply(this, args);

        if (result instanceof Promise) {
          return result.catch((err: unknown) => {
            capture(err);
            throw err;
          });
        }

        return result;
      } catch (err) {
        capture(err);
        throw err;
      }
    } as T;
  },

  async loadSentry() {
    if (this.getEnv() === 'development' || !import.meta.env.VITE_SDK_API_URL) {
      return false;
    }

    if (this.client) {
      return true;
    }

    if (!this.getSentry()) {
      for (const src of this.getSentryScriptUrls()) {
        if (await this.loadScript(src)) break;
      }
    }

    if (!this.getSentry()) return false;

    this.initSentryOnBrowser();
    return !!this.client;
  }
}
