import './css/style.css'
import { ZotloCheckout } from './lib'

(async () => {
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
          window.getComputedStyle(document.body).backgroundColor
        );
      }
    }
  });

  checkout.mount('zotlo-checkout');
})();
