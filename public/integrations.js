/**
 * APIResponse type definition
 * @typedef {Object} APIResponse
 * @property {any} data - The response data
 * @property {Record<string, any>} headers - The response headers
 * @property {number} status - The HTTP status code
 */

/**
 * @typedef {Object} PageViewPayload
 * @property {string} fbp
 */

/**
 * @typedef {Object} GoogleAds
 * @property {0|1} isActive
 * @property {string} gTag
 * @property {string} conversionId
 * @property {string} conversionLabel
 */

/**
 * @typedef {Object} Integrations
 * @property {Object} gtmData
 * @property {0|1} gtmData.isActive
 * @property {string} gtmData.gtmCode
 * @property {string} gtmData.gtmDomain
 * @property {Object} facebookData
 * @property {0|1} facebookData.isActive
 * @property {string} facebookData.pixelId
 * @property {'both'|'pixel'|'capi'} facebookData.integrationType
 * @property {Object} gaData
 * @property {0|1} gaData.isActive
 * @property {string} gaData.gaCode
 * @property {Object} googleAdsData
 * @property {0|1} googleAdsData.isActive
 * @property {string} googleAdsData.gTag
 * @property {string} googleAdsData.conversionId
 * @property {string} googleAdsData.conversionLabel
 */

(() => {
  const COOKIE = {
    UUID: "zc_uuid",
    COOKIE_CONSENT: 'cookieConsent',
    FBCLICK_ID: '_fbc',
    FBBROWSER_ID: '_fbp',
  }

  const consentCountries = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE", "TR", "GB"
  ];

  const logSyle = 'background: #2E495E;border-radius: 0.5em;color: white;font-weight: bold;padding: 2px 0.5em;';

  /**
   * @param {string} str 
   */
  function isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Retrieves the value of a cookie by its name.
   * @param {string} name - The name of the cookie to retrieve.
   * @returns {any} The decoded value of the cookie if found, null otherwise.
   */
  function getCookie(name) {
    const nameEQ = encodeURIComponent(name) + "=";
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1);
      }

      if (cookie.indexOf(nameEQ) === 0) {
        const val = decodeURIComponent(cookie.substring(nameEQ.length));

        if (!isNaN(parseFloat(val))) {
          return parseFloat(val);
        }

        if (val === 'true' || val === 'false') {
          return val === 'true';
        }

        if (val === 'null') return null;
        if (val === 'undefined') return undefined;
        if (isJSON(val)) {
          return JSON.parse(val);
        }

        return val
      }
    }

    return null;
  }

  /**
   * @param {Object} payload
   * @param {string} payload.name
   * @param {string} payload.value
   * @param {Date | number | null} [expires] - Expire as date object or minutes in number
   * @param {string} [payload.path="/"]
   * @param {boolean} [payload.secure=false]
   * @param {"Strict"|"Lax"|"None"} [payload.sameSite="Lax"]
   * @param {string} [payload.domain]
   */
  function setCookie(payload) {
    // Build cookie string
    let cookieString = `${encodeURIComponent(payload.name)}=${encodeURIComponent(payload.value)}`;

    if (payload.expires !== undefined) {
      let expires = '';
      if (payload.expires instanceof Date) {
        expires = 'expires=' + new Date(getTimeAsUTC(payload.expires)).toUTCString();
      } else {
        if (payload.expires === null) payload.expires = 1;
        const d = new Date(getTimeAsUTC());
        d.setTime(d.getTime() + (payload.expires * 24 * 60 * 60 * 1000));
        expires = 'expires=' + d.toUTCString();
      }

      cookieString += `; ${expires}`;
    }

    if (payload.domain) {
      cookieString += `; domain=${payload.domain}`;
    }

    cookieString += `; path=${payload.path || '/'}`;
    if (payload.secure) cookieString += "; secure";
    cookieString += `; samesite=${payload.sameSite || 'Lax'}`;
    // Set the cookie
    window.document.cookie = cookieString;
  }

  /**
   * @param {Date} [date] - Optional date parameter
   * @returns {number} UTC timestamp
   */
  function getTimeAsUTC(date) {
    const current = date ? new Date(date) : new Date();
    return Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate(),
      current.getUTCHours(),
      current.getUTCMinutes(),
      current.getUTCSeconds(),
      current.getUTCMilliseconds()
    );
  }

  /**
   * @param {Date} [date] - Optional date parameter
   * @param {number} [asMin=30] - Optional minutes parameter
   * @returns {Object} Expiration time object
   */
  function generateExpireTime(date, asMin) {
    const oneMin = 1 / 24 / 60;
    const time = oneMin * (typeof asMin === 'number' ? asMin : 30); // This is session expire time. You can change all expire time just here
    const d = new Date(getTimeAsUTC(date));
    d.setTime(d.getTime() + (time * 24 * 60 * 60 * 1000));

    return {
      num: time,
      date: d,
      iso: d.toISOString(),
      utc: d.toUTCString(),
      client: d.toString()
    }
  }

  /**
   * 
   * @param {string} query 
   * @returns {Record<string, any>} Parsed query string as an object
   */
  function parseQueryString(query) {
    const list = (query ? (query.charAt(0) === '?' ? query.slice(1) : query) : '').split('#');
    const qStr = list[0] || '';
  
    return qStr.split('&').reduce((acc, str) => {
      const [ key, value ] = str.split('=');
  
      if (key && !Object.prototype.hasOwnProperty.call(acc, key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  /**
   * 
   * @param {string} cookieText 
   */
  function checkConsent(cookieText, countryCode) {
    const cookieApp = window.VueCookieApp;
    if (!cookieApp || !cookieApp._) return false;

    const cookiePopup = cookieApp._.refs.cookiePopup;
    if (!cookiePopup) return false;

    const shouldGetConsent = countryCode ? consentCountries.includes(countryCode) : true;
    if (!shouldGetConsent) return false;

    const consentValue = cookiePopup.currentConsentValue();
    if (consentValue !== null) return consentValue;

    // Update the cookie consent popup text
    cookiePopup.updateText(cookieText);
    
    // Show the cookie consent popup
    cookiePopup.toggle(true);
  }

  const Facebook = {
    options: {
      id: null,
      debug: false,
      pageSlug: '',
      countryCode: ''
    },
  
    log(...args) {
      if (this.options.debug) {
        console.log("%cFacebook Pixel", logSyle, ...args);
      }
    },
    
    event(...args) {
      if (!this.options.id) return
      if (window.fbq) {
        window.fbq(...args);
      }
      this.log("event", args);
    },
  
    track(...args) {
      if (!this.options.id) return
      this.event('track', ...args);
    },
    
    /**
     * @param {Object} payload
     * @param {string} payload.value
     * @param {string} payload.currency
     * @param {string} payload.orderID
     * @param {string} [payload.eventID]
     */
    purchase(payload) {
      this.track('Purchase', {
        value: payload.value,
        currency: payload.currency
      }, {
        eventID: payload.eventID,
        orderID: payload.orderID,
      })
    },
  
    prepareCAPIParams(siteUrl) {
      const fbParams = {
        [COOKIE.FBCLICK_ID]: getCookie(COOKIE.FBCLICK_ID) || '',
        [COOKIE.FBBROWSER_ID]: getCookie(COOKIE.FBBROWSER_ID) || ''
      };
  
      const location = new URL(`${siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}`);
      const query = parseQueryString(location.search || '');
      const fbclid = query.fbclid || ''
  
      if (!fbParams[COOKIE.FBCLICK_ID] && fbclid) {
        const subdomainIndex = 1;
        /* let subdomainIndex = location.host.split('.').length - 1;
        if (subdomainIndex > 2) subdomainIndex = 2;
        if (subdomainIndex < 0) subdomainIndex = 0; */
    
        fbParams[COOKIE.FBCLICK_ID] = `fb.${subdomainIndex}.${Date.now()}.${fbclid || ''}`;
      }
  
      return fbParams;
    },
  
    /**
     * @param {Object} params
     * @param {string} [params.siteUrl]
     * @param {string} [params.value]
     * @param {string} params.pageSlug
     */
    createCAPIClickID(params) {
      return {
        cookieName: COOKIE.FBCLICK_ID,
        exdays: generateExpireTime(new Date(new Date().setDate(new Date().getDate() + 90))).date, // 90 days
        value: params.value || '',
        path: params.pageSlug
      }
    },
  
    sendCAPIInfo() {
      const win = window;
  
      setTimeout(function timeoutSendCAPIInfo() {
        const params = Facebook.prepareCAPIParams(window.location.href);
        const hasAnyValue = !!Object.values(params).filter(Boolean).length;
  
        if (hasAnyValue) {
          sendFBCapi({
            fbp: params[COOKIE.FBBROWSER_ID]
          }, { hideErrorToast: true });
        }
      }, 1000);
  
      // Delete temp proxy object
      if (win.proxy1) delete win.proxy1;
    },
  
    /**
     * @param {Object} payload
     * @param {(number|string)} payload.pixelId
     * @param {boolean} [payload.debug]
     * @param {string} payload.pageSlug
     * @param {string} payload.countryCode
     */
    init(payload) {
      const headScripts = {
        script: [],
        noscript: []
      };
  
      if (this.options.id) return headScripts;
      if (!payload.pixelId) {
        console.warn("Facebook Pixel cannot be installed because there is no Pixel ID!");
        return headScripts;
      }
  
      this.options.id = payload.pixelId;
      this.options.debug = !!payload.debug;
      this.options.pageSlug = payload.pageSlug;
      this.options.countryCode = payload.countryCode;
  
      if (this.options.debug) {
        this.event('init', this.options.id);
        this.track('PageView');
        return headScripts;
      }
  
      if (window.document) {
        (function(f, b, e, v) {
          if (f.fbq) return;
          const n = f.fbq = function(...args) { 
            return n.callMethod
              // eslint-disable-next-line prefer-spread
              ? n.callMethod.apply(n, args)
              : n.queue.push(args)
            };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          const t = b.createElement(e);
          t.async=!0;
          t.src=v;
          t.onload=function() {
            const win = window;
            if (win) {
              win.loadedIntegrations=win.loadedIntegrations||[];
              win.loadedIntegrations.push('FB');
            }
          }
          const s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document,'script', 'https://connect.facebook.net/en_US/fbevents.js');
        this.event('init', this.options.id);
        this.track('PageView');
      }
  
      headScripts.noscript.push({
        body: true,
        innerHTML: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${this.options.id}&ev=PageView&noscript=1" />`
      })
  
      return headScripts
    }
  }

  const GTM = {
    options: {
      id: null,
      debug: false,
    },
    hasConsent: () => {
      return getCookie(COOKIE.COOKIE_CONSENT);
    },
  
    log(...args) {
      if (this.options.debug) {
        console.log(`%c${this.name || 'GTM'}`, logSyle, ...args);
      }
    },
  
    /**
     * @param {Record<string, any>} obj 
     */
    push(obj) {
      if (!this.options.id) return;
      if (window.dataLayer) {
        window.dataLayer.push(obj);
      }
      this.log('push', obj);
    },
  
    gtag(...args) {
      if (!this.options.id) return;
      if (window.gtag) {
        window.gtag(...args);
      }
      this.log.bind({ ...this, name: 'GA4' })('gtag', args)
    },
  
    consent(granted) {
      this.gtag('consent', 'update', {
        ad_storage: granted ? 'granted': 'denied',
        ad_user_data: granted ? 'granted': 'denied',
        ad_personalization: granted ? 'granted': 'denied',
        analytics_storage: granted ? 'granted': 'denied',
      })
    },

    /**
     * Initializes Google Tag Manager with the provided payload
     * @param {Object} payload - The payload containing GTM ID and optional parameters
     * @param {string} payload.id - The GTM ID
     * @param {string} [payload.domain] - Optional domain for GTM scripts
     * @param {boolean} [payload.debug] - Optional debug mode flag
     * @returns {Object} An object containing script and noscript tags for GTM
     */
    init(payload) {
      const headScripts = {
        script: [],
        noscript: []
      };
  
      if (!payload.id) {
        console.warn('GTM cannot be installed because there is no GTM ID!');
        return headScripts;
      }
  
      this.options.id = payload.id;
      this.options.debug = !!payload.debug;
  
      if (payload.debug) {
        this.log('init', payload.id);
        return headScripts;
      }
  
      let isDefatulGranted = 'denied';
      if (payload.granted || this.hasConsent()) isDefatulGranted = 'granted';
      const domain = payload.domain || 'https://www.googletagmanager.com';
  
      headScripts.script = [
        {
          innerHTML: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            ${
              payload.granted
                ? ''
                : `gtag('consent', 'default', {
            'ad_storage': '${isDefatulGranted}',
            'ad_user_data': '${isDefatulGranted}',
            'ad_personalization': '${isDefatulGranted}',
            'analytics_storage': '${isDefatulGranted}'
          });`
            }
          `
        },
        {
          innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          '${domain}/gtm.js?id='+i+dl;j.onload=function(){w.loadedIntegrations=w.loadedIntegrations||[];w.loadedIntegrations.push('GTM')};f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${this.options.id}');`
        },
      ];
  
      headScripts.noscript = [{
        body: true,
        innerHTML: `<iframe src="${domain}/ns.html?id=${this.options.id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
      }];
  
      return headScripts;
    },
  };
  
  const GA4 = {
    options: {
      gaCode: null,
      /** @type {GoogleAds}  */
      googleAds: {},
      debug: false,
    },
    hasConsent: () => {
      return getCookie(COOKIE.COOKIE_CONSENT);
    },
  
    log(...args) {
      if (this.options.debug) {
        console.log(`%c${this.name || 'GA4'}`, logSyle, ...args);
      }
    },
  
    gtag(...args) {
      if (!this.options.gaCode && !this.options.googleAds.gTag) return;
      if (window.gtag) {
        window.gtag(...args);
      }
      this.log.bind({ ...this, name: 'GA4' })('gtag', args)
    },
  
    consent(granted) {
      const value = granted ? 'granted': 'denied';
      this.gtag('consent', 'update', {
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
        analytics_storage: value,
      });
    },
  
    getConversionLabel() {
      const { conversionId, conversionLabel } = this.options.googleAds || {};
      return `${conversionId}/${conversionLabel}`;
    },
  
    /**
     * @param {Object} payload
     * @param {string} payload.gaCode
     * @param {boolean} [payload.granted]
     * @param {boolean} [payload.debug]
     * @param {GoogleAds} [payload.googleAds]
     */
    init(payload) {
      const headScripts = {
        script: [],
        noscript: []
      };
  
      if (!payload.gaCode) {
        console.warn('GA4 cannot be installed because there is no GA4 Code!');
        if (!payload.googleAds?.isActive) return headScripts;
      }
      
      if (payload.googleAds?.isActive && !payload.googleAds.gTag) {
        console.warn('GTag cannot be installed because there is no Gtag Code!');
  
        if (!payload.gaCode) return headScripts;
      }
  
      this.options.gaCode = payload.gaCode;
      this.options.debug = !!payload.debug;
      if (payload.googleAds) this.options.googleAds = payload.googleAds;
  
      const initTagId = this.options.gaCode || this.options.googleAds?.gTag;
  
      if (this.options.debug) {
        this.log.bind({ ...this, name: 'GA4' })('init', initTagId);
        return headScripts;
      }
  
      let isDefatulGranted = 'denied';
      if (payload.granted || this.hasConsent()) isDefatulGranted = 'granted';
  
      const configs = [this.options.gaCode, this.options.googleAds?.gTag]
        .filter(Boolean)
        .map((code) => `gtag('config', '${code}');`)
        .join('\n');
      const onload = function() {
        const w = window;
        w.loadedIntegrations = w.loadedIntegrations || [];
        w.loadedIntegrations.push('GA4');
      }
  
      headScripts.script = [
        {
          src: `https://www.googletagmanager.com/gtag/js?id=${initTagId}`,
          async: true,
          onload: onload
        },
        {
          innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          ${
            payload.granted
             ? ''
             : `gtag('consent', 'default', {
            'ad_storage': '${isDefatulGranted}',
            'ad_user_data': '${isDefatulGranted}',
            'ad_personalization': '${isDefatulGranted}',
            'analytics_storage': '${isDefatulGranted}'
          });`
          }
          gtag('js', new Date());
          ${configs}`
        }
      ];
  
      return headScripts;
    }
  }

  const Integration = {
    /** @type {Integrations} */
    list: {},
    data: {
      countryCode: ''
    },
    debug: false,

    /**
     * 
     * @param {string} countryCode
     * @param {Integrations} list
     * @returns 
     */
    init(countryCode, list) {
      this.data.countryCode = countryCode || '';
      this.list = list || {}
      const headScripts = {
        script: [],
        noscript: []
      };
  
      const cookieConsent = getCookie(COOKIE.COOKIE_CONSENT);
      const isDefaultGranted = !!cookieConsent || !consentCountries.includes(this.data.countryCode);
      const gaData = this.list.gaData;
      const gtmData = this.list.gtmData;
      const googleAdsData = this.list.googleAdsData;
  
      if (gtmData && !!gtmData.isActive && !!gtmData.gtmCode) {
        const scripts = GTM.init({
          id: gtmData?.gtmCode,
          domain: gtmData?.gtmDomain,
          granted: isDefaultGranted,
          debug: this.debug,
        });
  
        headScripts.script.push(...scripts.script);
        headScripts.noscript.push(...scripts.noscript);
      }
  
      if (
        (gaData && !!gaData.isActive && !!gaData.gaCode) ||
        (googleAdsData && googleAdsData.isActive && !!googleAdsData.gTag)
      ) {
        const scripts = GA4.init({
          googleAds: googleAdsData,
          gaCode: gaData ? gaData.gaCode : '',
          granted: isDefaultGranted,
          debug: this.debug,
        });
  
        headScripts.script.push(...scripts.script);
      }
  
      // Init if user access granted on cookie popup
      if (cookieConsent) {
        const metaScripts = this.meta();
  
        headScripts.script.push(...metaScripts.script);
        headScripts.noscript.push(...metaScripts.noscript);
      }
  
      return headScripts;
    },

    meta() {
      const facebookData = this.list.facebookData;
      const pageSlug = window.location.pathname || '';
  
      const headScripts = {
        script: [],
        noscript: []
      };

      if (
        !facebookData ||
        !facebookData.isActive ||
        facebookData.integrationType === 'capi'
      ) return headScripts;
  
      if (!!facebookData.pixelId) {
        const payload = {
          pixelId: facebookData.pixelId,
          debug: this.debug,
          pageSlug,
          countryCode: this.data.countryCode
        };
  
        const scripts = Facebook.init(payload);
  
        headScripts.script.push(...scripts.script);
        headScripts.noscript.push(...scripts.noscript);
      }
  
      return headScripts;
    },

    /**
     * 
     * @param {Array<{src?: string, async?: boolean; onload?: Function; innerHTML?: string}>} list 
     */
    loadScripts(list) {
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const script = document.createElement('script');
        script.async = item.async || false;
        if (item.onload) script.onload = item.onload;
        if (item.innerHTML) {
          script.innerHTML = item.innerHTML || '';
        } else if (item.src) {
          script.src = item.src;
        }

        document.head.appendChild(script);
      }
    }
  }

  window.checkConsent = checkConsent;
  window.setCookie = setCookie;
  window.getCookie = getCookie;
  window.Facebook = Facebook;
  window.GTM = GTM;
  window.GA4 = GA4;
  window.Integration = Integration;
})();
