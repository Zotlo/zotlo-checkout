import './css/style.css'
import { ZotloCheckout } from './lib'

(async () => {
  const win = window as any;

  const checkout = await ZotloCheckout({
    token: '123ASDASsqasdas=',
    packageId: 'zotlo-123',
    returnUrl: 'https://example.com/return-url',
    language: 'en',
    subscriberId: '',
    events: {
      onLoad(config) {
        // Set background color
        document.body.style.backgroundColor = (
          config.backgroundColor ||
          win.getComputedStyle(document.body).backgroundColor
        );

        if (config.sandbox) {
          const strip = document.getElementById('sandbox-strip');
          if (strip) strip.style.display = 'flex';
        }

        if (!win.Integration) return;

        win.checkConsent(config.cookieText, config.countryCode);

        // Load itegrations
        const Integration = win.Integration || {};
        Integration.debug = config.sandbox;

        const headScripts = Integration.init(config.countryCode, config.integrations);
        Integration.loadScripts(headScripts.script || []);

        // Load integration events
        win.EventActions.payment.loadGTMClickEvents();
      },
      onSuccess(result) {
        if (!win.EventActions) return;
        setTimeout(() => {
          win.EventActions.success.complete(result);
        }, 0);
      },
      onFail(error) {
        const message = error.message || 'An error occurred during payment processing';
        win.VueApp.addToaster('Error', message);
        win.EventActions.payment.paymentGTMError(message);
      },
      onInvalidForm(error) {
        const message = error.result.errors[0] || 'Unknown error';
        const formattedMessage = error.name ? `${error.name} - ${message}` : message;
        win.EventActions.payment.paymentGTMError(formattedMessage);
      }
    }
  });

  checkout.mount('zotlo-checkout');
})();
