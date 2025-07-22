window.EventActions = {
  general: {
    pageView() {
      window.GA4.gtag('event', 'page_view', {
        page_title: document?.title || '',
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

    loadGTMClickEvents() {
      const buttons = document.querySelectorAll('.zotlo-checkout__button');

      for (const button of buttons) {
        button.addEventListener('click', EventActions.payment.onClickButtons);
      }

      window.Facebook.track('AddToCart');
      EventActions.general.pageView();
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

      EventActions.general.pageView();
    },

    complete(result) {
      EventActions.success.loadClickEvents();

      const app = result.application || {};
      const packageData = result.payment.package || {};
      const utmSource = (window.getCookie('utmInfo') || {})?.utm_source || '';

      const {
        transaction_id: transactionId = ' ',
        currency = ' ',
        price = '0.00',
        provider_name: paymentMethod = ''
      } = result?.transaction?.[0] || {};

      window.GTM.push({
        event: 'success',
        successType: 'Payment'
      });

      window.GA4.gtag('event', 'success', {
        successType: 'Payment'
      });

      const gtmObj = {
        transaction_id: transactionId,
        value: price,
        currency,
        coupon: ' ',
        subscriber_id: result.client.subscriberId || '',
        items: [
          {
            item_id: packageData.packageId,
            item_name: packageData.name,
            affiliation: utmSource,
            coupon: ' ',
            index: 1,
            item_brand: app.name || ' ',
            item_category: packageData.periodType || ' ',
            price,
            quantity: 1
          }
        ]
      }

      const subscriptionStarted = {
        subscriber_id: gtmObj.subscriber_id,
        transaction_id: gtmObj.transaction_id
      }

      window.GTM.push({ event: 'subscription_started', ...subscriptionStarted });
      window.GA4.gtag('event', 'subscription_started', subscriptionStarted);
      window.GTM.push({ event: 'purchase', payment_method: paymentMethod, ecommerce: gtmObj });
      window.GA4.gtag('event', 'purchase', { payment_method: paymentMethod, ...gtmObj, });

      if (window.GA4.options.googleAds.isActive) {
        window.GA4.gtag('event', 'conversion', {
          send_to: window.GA4.getConversionLabel(),
          value: gtmObj.value,
          currency: gtmObj.currency,
          transaction_id: gtmObj.transaction_id
        })
      }

      window.Facebook.purchase({
        value: price,
        currency,
        orderID: transactionId,
        eventID: transactionId,
      });
    }
  },
}
