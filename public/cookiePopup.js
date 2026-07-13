(() => {
  let Vue = globalThis.Vue;
  let createApp = Vue.createApp;

  function currentConsentValue() {
    if (!window.getCookie) return false;
    return window.getCookie('cookieConsent');
  }

  // Do not initialize if consent is already given
  if (currentConsentValue() !== null) return;

  const CookiePopup = {
    template: `
    <div v-if="show" class="zotlo-checkout__cookie">
      <div class="zotlo-checkout__cookie__text" v-html="text" />
        <div class="zotlo-checkout__cookie__actions">
        <button data-cookie="reject" @click="declineCookies">Reject</button>
        <button data-cookie="allow" @click="acceptCookies">Allow</button>
      </div>
    </div>
    `,
    props: {
      show: { type: Boolean, default: false },
      text: { type: String, default: '' }
    },
    data() {
      return { content_id: '' }
    },
    methods: {
      toggle(show, content_id = '') {
        this._.props.show = !!show;
        this._.data.content_id = content_id;
      },
      updateText(text) {
        this._.props.text = text;
      },
      currentConsentValue() {
        return currentConsentValue();
      },
      updateConsent(granted) {
        if (!window.setCookie) return;
  
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
  
        const domain = window.location.hostname.split(".").slice(-2).join(".");
        const path = window.location.pathname || "/";
  
        window.setCookie({
          name: 'cookieConsent',
          value: granted ? 'true' : 'false',
          secure: true,
          sameSite: 'Strict',
          expires: date,
          domain: domain,
          path: path
        });

        if (window.Integration) {
          window.GTM.consent(granted);

          if (!window.GTM.options.id) {
            window.GA4.consent(granted);
          }

          // Init other integrations
          if (granted) {
            window.Integration.meta();
            window.Integration.tiktok();

            const myEvent = new CustomEvent('cookieConsent', {
              detail: { consent: granted },
              bubbles: true, 
              cancelable: true
            });

            document.dispatchEvent(myEvent);
          }
        }

        this.toggle(false, this._.data.content_id);

        // Clear instances
        window.VueCookieApp._.appContext.app.unmount();
        delete window.VueCookieApp;
      },
      acceptCookies() {
        this.updateConsent(true);
      },
      declineCookies() {
        this.updateConsent(false);
      }
    }
  };

  window.VueCookieApp = createApp({
    components: { CookiePopup },
    template: `<CookiePopup ref="cookiePopup" />`,
  }).mount('#app2');
})();
