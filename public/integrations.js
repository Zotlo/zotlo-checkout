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
 * @property {Object} tiktokData
 * @property {0|1} tiktokData.isActive
 * @property {string} tiktokData.pixelId
 * @property {'both'|'pixel'|'capi'} tiktokData.integrationType
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
  let EXTERNAL_ID;

  const COOKIE = {
    UUID: "zc_uuid",
    COOKIE_CONSENT: 'cookieConsent',
    FBCLICK_ID: '_fbc',
    FBBROWSER_ID: '_fbp',
    TTCLICK_ID: 'ttclid',
    TTBROWSER_ID: '_ttp',
  }

  const consentCountries = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE", "TR", "GB"
  ];

  const logSyle = 'background: #2E495E;border-radius: 0.5em;color: white;font-weight: bold;padding: 2px 0.5em;';

  getExternalId().then((id) => {EXTERNAL_ID = id});

  function parseValue(value) {
    if (value === 'true') return true;
    else if (value === 'false') return false;
    else if (value === undefined) return undefined;
    else if (value === null) return null;
    else if (isJSON(value)) return JSON.parse(value);
    else if (!isNaN(Number(value))) return +value;
    return value;
  }

  function isPlainObject(item) {
    return (!!item && typeof item === 'object' && !Array.isArray(item));
  }

  function mergeDeep(target, ...sources) {
    if (!sources.length) return { ...target };
    const source = sources.shift();
    const result = { ...target };

    if (isPlainObject(result) && isPlainObject(source)) {
      for (const key in source) {
        if (isPlainObject(source[key])) {
          result[key] = mergeDeep(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return mergeDeep(result, ...sources);
  }

  async function sha256(message) {
    // encode as (utf-8) Uint8Array
    const msgBuffer = new TextEncoder().encode(message);                    

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert buffer to byte array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

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

        if (val.trim() !== '' && !isNaN(val) && !isNaN(parseFloat(val))) {
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
   * @param {Object} [params] - Optional parameters
   * @param {string} [params.path] - The path
   * @param {boolean} [params.useCookie] - Whether to use cookie
   * @param {string} [params.key] - The cookie key
   */
  function getSession(params) {
    const { path, useCookie, key } = params || {};
    if (useCookie) {
      const id = getCookie(key || COOKIE.UUID)
      return { id };
    }
    const sessionString = localStorage.getItem(key || COOKIE.UUID);
    const sessions = (sessionString ? JSON.parse(atob(sessionString)) : null);
    const pathName = path || globalThis?.location?.pathname || "/";
    const session = sessions?.[pathName];
    return session;
  }

  function getSessionId() {
    const session = getSession({ key: COOKIE.UUID });
    return session?.id || '';
  }

  function getEventId(eventName) {
    return getSessionId() + '_' + eventName;
  }

  async function getExternalId() {
    return sha256(getSessionId());
  }  

  /**
   * 
   * @param {string} cookieText 
   * @param {string} countryCode
   * @param {string} content_id
   */
  function checkConsent(cookieText, countryCode, content_id) {
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
    cookiePopup.toggle(true, content_id);
  }

  const Tiktok = {
    options: {
      id: null,
      debug: false,
      pageSlug: '',
      countryCode: '',
    },

    // Temporary store for events triggered before cookie consent is given
    temp: [],

    log(...args) {
      if (this.options.debug) {
        console.log("%cTiktok Pixel", logSyle, ...args);
      }
    },

    loadTemp() {
      for (const args of this.temp) {
        globalThis?.ttq?.[args[0]]?.(...args[1]);
      }
    },

    getAMData() {
      return {
        external_id: EXTERNAL_ID,
        country: this.options.countryCode,
      }
    },

    /**
     * 
     * @param {string} eventName 
     * @param {Record<string, any>} [params] 
     * @param {Record<string, any>} [thirdArgs] 
     * @param  {...any} restOfArgs 
     * @returns 
     */
    event(eventName, params, thirdArgs, ...restOfArgs) {
      const cookieConsent = parseValue(getCookie(COOKIE.COOKIE_CONSENT));
      const paramObj = mergeDeep({...(params || {})}, this.getAMData());
      const thirdArgsObj = mergeDeep({...(thirdArgs || {})}, { event_id: getEventId(eventName) });
      const argList = [eventName, paramObj, thirdArgsObj, ...restOfArgs];

      globalThis?.ttq?.track?.(...argList);

      if (!cookieConsent && eventName !== 'Pageview') {
        this.temp.push(['track', argList]);
      }

      this.log("event", argList);
    },

    track(...args) {
      this.event(...args);
    },

    /**
     * 
     * @param {Object} payload 
     * @param {string} [payload.email]
     * @param {string} [payload.phone_number]
     */
    identify(payload) {
      const cookieConsent = parseValue(getCookie(COOKIE.COOKIE_CONSENT));
      const paramObj = mergeDeep({ ...(payload || {}) }, {
        external_id: EXTERNAL_ID,
      });

      globalThis?.ttq?.identify?.(paramObj);

      if (!cookieConsent) {
        this.temp.push(['identify', [paramObj]]);
      }

      this.log("identify", paramObj);
    },

    /**
     * @param {Object} payload
     * @param {any} payload.value
     * @param {any} payload.currency
     * @param {string} payload.description
     * @param {string} payload.content_id
     * @param {string} payload.orderID
     * @param {Object} payload.context
     * @param {Object} [payload.contents]
     * @param {string} payload.contents[].content_id
     * @param {string} payload.contents[].content_name
     * @param {number} payload.contents[].price
     * @param {number} payload.contents[].quantity
     */
    purchase(payload) {
      this.event('Purchase', {
        quantity: 1,
        content_type: 'product',
        ...payload
      });
    },

    /** 
     * @param {string} siteUrl
     * @param {Record<string, string>} [ttParams] - Optional TikTok parameters, if not provided, it will be retrieved from cookies and URL
    */
    prepareCAPIParams(siteUrl, ttParams) {
      ttParams = ttParams || {
        [COOKIE.TTCLICK_ID]: getCookie(COOKIE.TTCLICK_ID) || '',
        [COOKIE.TTBROWSER_ID]: getCookie(COOKIE.TTBROWSER_ID) || ''
      };

      const location = new URL(`${siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}`);
      const { ttclid } = parseQueryString(location?.search || '');

      if (!ttParams[COOKIE.TTCLICK_ID] && ttclid) {
        // const subdomainIndex = 1;
        /* let subdomainIndex = location.host.split('.').length - 1;
        if (subdomainIndex > 2) subdomainIndex = 2;
        if (subdomainIndex < 0) subdomainIndex = 0; */
    
        ttParams[COOKIE.TTCLICK_ID] = ttclid || '';
      }

      return ttParams;
    },

    /**
     * 
     * @param {Object} params 
     * @param {string} [params.siteUrl]
     * @param {string} [params.value]
     * @param {string} params.pageSlug
     */
    createCAPIClickID(params) {
      const { value, pageSlug } = params;

      return {
        cookieName: COOKIE.TTCLICK_ID,
        exdays: generateExpireTime(new Date(new Date().setDate(new Date().getDate() + 90))).date, // 90 days
        value: value || '',
        path: pageSlug
      }
    },

    sendCAPIInfo() {
      const win = globalThis;

      setTimeout(() => {
        const params = Tiktok.prepareCAPIParams(window.location.href);
        const hasAnyValue = !!Object.values(params).filter(Boolean).length;

        if (hasAnyValue) {
          const myEvent = new CustomEvent('sendCAPIInfo', {
            detail: {
              integration: 'TT',
              params: {
                ttclid: params[COOKIE.TTCLICK_ID],
                ttp: params[COOKIE.TTBROWSER_ID]
              }
            },
            bubbles: true, 
            cancelable: true
          });

          document.dispatchEvent(myEvent);
        }
      }, 1000);

      // Delete temp proxy object
      if (win?.proxy1) delete win.proxy1;

      // Destroy listener event
      win?.__EMITTER__?.off('tiktokLoad');
    },

    /**
     * @param {Object} payload
     * @param {(number|string)} payload.pixelId
     * @param {boolean} [payload.debug]
     * @param {string} payload.pageSlug
     * @param {string} payload.countryCode
     * @returns 
     */
    init(payload) {
      const headScripts = {
        script: [],
        noscript: []
      };

      if (this.options.id) return headScripts;
      if (!payload.pixelId) {
        console.warn("Tiktok Pixel cannot be installed because there is no Pixel ID!");
        return headScripts;
      }

      this.options.id = payload.pixelId;
      this.options.debug = !!payload.debug;
      this.options.pageSlug = payload.pageSlug;
      this.options.countryCode = payload.countryCode;

      if (this.options.debug) {
        this.track('load', this.options.id);
        this.track('page');
        return headScripts;
      }

      document.addEventListener('tiktokLoad', Tiktok.sendCAPIInfo.bind(this), { once: true });

      if (window.document) {
        (function (w, d, t, id, sid, ldtmp) {
          w.TiktokAnalyticsObject=t;
          var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},
          ttq.load=function(e,n) {
            var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},
            ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,
            o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a?.parentNode?.insertBefore(o,a);
            document.dispatchEvent(new CustomEvent('tiktokLoad', {detail: {},bubbles: true, cancelable: true}));
            w.loadedIntegrations=w.loadedIntegrations||[];
            w.loadedIntegrations.push('Tiktok');
          };
          ttq.load(id, { historyObserver: false });
          ttq.page(sid);
          ttq.identify({ external_id: sid.external_id });
          if (ldtmp) ldtmp();
        }(window, document, 'ttq', this.options.id, {...this.getAMData(), event_id: getEventId('page') }, () => this.loadTemp()));
      }

      return headScripts
    },
  };

  const Facebook = {
    options: {
      id: null,
      debug: false,
      pageSlug: '',
      countryCode: '',
    },

    // Temporary store for events triggered before cookie consent is given
    temp: [],
  
    log(...args) {
      if (this.options.debug) {
        console.log("%cFacebook Pixel", logSyle, ...args);
      }
    },

    loadTemp() {
      for (const args of this.temp) {
        globalThis?.fbq?.(...args);
      }
    },

    getAMData() {
      let clientIp;

      try {
        clientIp = Integration.data.ia ? atob(Integration.data.ia) : undefined
      } catch {}

      return {
        external_id: EXTERNAL_ID,
        country: this.options.countryCode,
        client_ip_address: clientIp,
        client_user_agent: globalThis?.navigator.userAgent,
        fbp: getCookie(COOKIE.FBBROWSER_ID) || undefined,
        fbc: getCookie(COOKIE.FBCLICK_ID) || undefined,
      };
    },
    
    /**
     * @param {string} eventType
     * @param {any} eventName
     * @param {any} [params]
     * @param {Record<string, any>} [forthArgs]
     * @param {...any} restOfArgs
     */
    async event(eventType, eventName, params, forthArgs, ...restOfArgs) {
      const cookieConsent = parseValue(getCookie(COOKIE.COOKIE_CONSENT));
      const paramObj = mergeDeep((params || {}), this.getAMData());
      const forthArgsObj = mergeDeep((forthArgs || {}), { eventID: getEventId(eventName) });
      const argList = [eventType, eventName, paramObj, forthArgsObj, ...restOfArgs];

      globalThis?.fbq?.(...argList);

      if (!cookieConsent && eventName !== 'PageView' && eventType !== 'init') {
        this.temp.push(argList);
      }

      this.log("event", argList);
    },

    /**
     * @param {...any} args
     */
    track(...args) {
      this.event('track', ...args);
    },

    /**
     * @param {...any} args
     */
    trackCustom(...args) {
      this.event('trackCustom', ...args);
    },
    
    /**
     * @param {Object} payload
     * @param {string} payload.value
     * @param {string} payload.currency
     * @param {Record<string, any>} payload.userData
     * @param {Record<string, any>} [payload.otherData]
     */
    purchase(payload) {
      this.track('Purchase', {
        value: payload.value,
        currency: payload.currency,
        pageUrl: window.location.href,
        ...(payload.otherData || {}),
        ...(payload.userData || {}),
        fbp: getCookie(COOKIE.FBBROWSER_ID) || '',
        fbc: getCookie(COOKIE.FBCLICK_ID) || ''
      });
    },
  
    prepareCAPIParams(siteUrl, fbParams) {
      fbParams = fbParams || {
        [COOKIE.FBCLICK_ID]: getCookie(COOKIE.FBCLICK_ID) || '',
        [COOKIE.FBBROWSER_ID]: getCookie(COOKIE.FBBROWSER_ID) || ''
      };
  
      const location = new URL(`${siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}`);
      const { fbclid } = parseQueryString(location?.search || '');
  
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
          const myEvent = new CustomEvent('sendCAPIInfo', {
            detail: {
              integration: 'FB',
              params: {
                fbp: params[COOKIE.FBBROWSER_ID],
                fbclid: params[COOKIE.FBCLICK_ID]
              }
            },
            bubbles: true, 
            cancelable: true
          });

          document.dispatchEvent(myEvent);
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
      this.options.ipAddress = payload.ipAddress;
  
      if (this.options.debug) {
        this.event('init', this.options.id);
        this.track('PageView');
        return headScripts;
      }

      const win = globalThis;
      document.addEventListener('fbLoad', Facebook.sendCAPIInfo.bind(this), { once: true });
  
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
            document.dispatchEvent(new CustomEvent('fbLoad', {detail: {},bubbles: true,cancelable: true}));
            if (win) {
              win.loadedIntegrations=win.loadedIntegrations||[];
              win.loadedIntegrations.push('FB');
            }
          }
          const s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document,'script', 'https://connect.facebook.net/en_US/fbevents.js');
        this.event('init', this.options.id, this.getAMData());
        this.track('PageView', this.getAMData());
        this.loadTemp();
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
      countryCode: '',
      ia: ''
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
        const tiktokScripts = this.tiktok();

        headScripts.script.push(...metaScripts.script, ...tiktokScripts.script);
        headScripts.noscript.push(...metaScripts.noscript, ...tiktokScripts.noscript);
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

    tiktok() {
      const tiktokData = this.list.tiktokData;
      const pageSlug = window.location.pathname || '';

      const headScripts = {
        script: [],
        noscript: []
      };

      if (tiktokData?.isActive && tiktokData?.integrationType !== 'capi' && !!tiktokData?.pixelId) {
        const payload = {
          pixelId: tiktokData.pixelId,
          debug: this.debug,
          pageSlug,
          countryCode: this.data.countryCode
        };

        const scripts = Tiktok.init(payload);

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

  globalThis.checkConsent = checkConsent;
  globalThis.setCookie = setCookie;
  globalThis.getCookie = getCookie;
  globalThis.Facebook = Facebook;
  globalThis.GTM = GTM;
  globalThis.GA4 = GA4;
  globalThis.Tiktok = Tiktok;
  globalThis.Integration = Integration;
})();
