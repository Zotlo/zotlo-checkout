import * as Sentry from '@sentry/browser';

export const Logger = {
  client: undefined as ReturnType<typeof Sentry['init']> | undefined,
  scope: undefined as Sentry.Scope | undefined,

  getSentry() {
    return (window as any)?.Sentry as (typeof Sentry | undefined);
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
    const SentryBrowser = this.getSentry() as typeof Sentry;

    return {
      dsn: 'https://153957e4d927936b0b109b0bb75dc1ae@o4509214333140992.ingest.de.sentry.io/4510227417923664',
      // Session Replay
      replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
      replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
      sendDefaultPii: true,
      environment: env,
      transport: SentryBrowser.makeFetchTransport,
      stackParser: SentryBrowser.defaultStackParser,
      integrations: SentryBrowser.getDefaultIntegrations({}),
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
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*jsdelivr\.net/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*browser-intake-datadoghq\.com/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*mixpanel\.com/i,
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*segment\.com/i,

        // Recommended in case of errors in Sentry's own domain (loop prevention)
        /^(?:https?:)?\/\/([a-z0-9-]+\.)*sentry\.io/i
      ],
    }
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

  async loadSentry() {
    return new Promise((resolve) => {
      if (this.getEnv() === 'development' || !import.meta.env.VITE_SDK_API_URL) {
        resolve(false);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js-de.sentry-cdn.com/153957e4d927936b0b109b0bb75dc1ae.min.js';
      script.crossOrigin = 'anonymous';

      script.onerror = () => resolve(false);

      (globalThis as any).sentryOnLoad = function onLoadZotloSentry () {
        Logger.initSentryOnBrowser();
        resolve(true);
      }

      document.head.appendChild(script);
    });
  }
}
