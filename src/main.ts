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
      },
      onFail(e) {
        win?.VueApp?.addToaster('Error', e?.message)
      }
    }
  });

  checkout.mount('zotlo-checkout');
})();
