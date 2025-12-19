import './css/style.css'
import { ZotloCheckout } from './lib'
import { ZotloCard } from './lib/card'

(async () => {
  const win = window as any;
  const toggleFormButton = document.getElementById('toggle-form-button');
  const forms = {
    checkout: null as Awaited<ReturnType<typeof ZotloCheckout>> | null,
    card: null as Awaited<ReturnType<typeof ZotloCard>> | null
  }

  const loading = {
    checkout: false,
    card: false
  }

  const events: Parameters<typeof ZotloCheckout>[0]['events'] = {
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
  };

  const settings = {
    token: '123ASDASsqasdas=',
    packageId: 'zotlo-123',
    returnUrl: 'https://example.com/return-url',
    language: 'en',
    subscriberId: '',
    events
  }

  function setLoading(form: 'card' | 'checkout', isLoading: boolean) {
    loading[form] = isLoading;
    if (!toggleFormButton) return;
    if (isLoading) {
      toggleFormButton.textContent = 'Loading...';
      toggleFormButton.setAttribute('disabled', isLoading ? 'true' : 'false');
    } else {
      toggleFormButton.textContent = form === 'card'
        ? 'Switch to Checkout Form'
        : 'Switch to Card Form';

      toggleFormButton?.setAttribute('data-switchto', form === 'card' ? 'checkout' : 'card');
      toggleFormButton.removeAttribute('disabled');
    }
  }

  function toggleForm() {
    const switchTo = toggleFormButton?.getAttribute('data-switchto');
    switch(switchTo) {
      case 'card': {
        forms.checkout?.unmount();
        forms.checkout = null;
        loadCardForm();
      };break;
      case 'checkout': {
        forms.card?.unmount();
        forms.card = null;
        loadCheckoutForm();
      };break;
    }
  }

  async function loadCheckoutForm() {
    if (loading.checkout || forms.checkout) return;
    try {
      setLoading('checkout', true);
      forms.checkout = await ZotloCheckout(settings);
      forms.checkout.mount('zotlo-checkout');
    } finally {
      setLoading('checkout', false);
    }
  }

  async function loadCardForm() {
    if (loading.card || forms.card) return;
    try {
      setLoading('card', true);
      forms.card = await ZotloCard({
        ...settings,
        subscriberId: 'test@example.com',
        style: {
          design: {
            label: {
              show: false
            }
          }
        }
      });

      forms.card.mount('zotlo-card');
    } finally {
      setLoading('card', false);
    }
  }

  toggleFormButton?.addEventListener('click', toggleForm);
  toggleFormButton?.click();
})();
