window.EventActions = {
  general: {
    pageView(title) {
      window.GA4.gtag('event', 'page_view', {
        page_title: title || document?.title || '',
        page_location: window.location.pathname || '',
        previous_page_path: new URL(document.referrer || window.location.origin)?.pathname || '',
      });
    },

    /**
     * @param {MouseEvent} event 
     * @param {string} category
     */
    onClickButtons(event, category) {
      let text = event.target.innerText || '';

      if (!text) {
        const img = event.target.tagName === 'IMG'
          ? event.target
          : event.target?.querySelector('img');

        if (img) text = img.alt || img.title || '';
      }

      window.GTM.push({
        event: 'customClick',
        clickCategory: category,
        clickName: text
      });

      window.GA4.gtag('event', 'customClick', {
        clickCategory: category,
        clickName: text
      });
    }
  },
  payment: {
    onClickButtons(event) {
      EventActions.general.onClickButtons(event, 'Payment');
    },

    removeClickEvents() {
      const buttons = document.querySelectorAll('.zotlo-checkout__button');

      for (const button of buttons) {
        button.removeEventListener('click', EventActions.payment.onClickButtons);
      }
    },

    loadGTMClickEvents(content_id) {
      const buttons = document.querySelectorAll('.zotlo-checkout__button');

      for (const button of buttons) {
        button.addEventListener('click', EventActions.payment.onClickButtons);
      }

      const myEvent = new CustomEvent('cookieConsent', {
        detail: { consent: window?.getCookie('cookieConsent') },
        bubbles: true, 
        cancelable: true
      });

      document.dispatchEvent(myEvent);
      EventActions.general.pageView('Payment');
    },

    paymentGTMError(message) {
      window.GTM.push({
        event: 'error',
        errorCategory: 'Payment',
        errorType: message
      });

      window.GA4.gtag('event', 'error', {
        errorCategory: 'Payment',
        errorType: message
      });
    }
  },
  success: {
    onClickButtons(event) {
      EventActions.general.onClickButtons(event, 'Thank You Page');
    },

    removeClickEvents() {
      const buttons = document.querySelectorAll('.zotlo-checkout__success .zotlo-checkout__button, .zotlo-checkout__success a[href]:not([href="#"]):not([href=""])');

      for (const button of buttons) {
        button.removeEventListener('click', EventActions.success.onClickButtons);
      }
    },

    loadClickEvents() {
      EventActions.payment.removeClickEvents();

      const buttons = document.querySelectorAll('.zotlo-checkout__success .zotlo-checkout__button, .zotlo-checkout__success a[href]:not([href="#"]):not([href=""])');

      for (const button of buttons) {
        button.addEventListener('click', EventActions.success.onClickButtons);
      }

      EventActions.general.pageView('Success');
    },

    complete(result) {
      EventActions.success.loadClickEvents();
    }
  },
}
