/// <reference types="vite/client" />

// vite-env.d.ts
declare const __APP_NAME__: string;
declare const __APP_VERSION__: string;

interface Window {
  Facebook?: { track: (...args: any[]) => void; purchase: (...args: any[]) => void; [key: string]: any };
  Tiktok?: { track: (...args: any[]) => void; purchase: (...args: any[]) => void; [key: string]: any };
  GTM?: { push: (...args: any[]) => void; };
  GA4?: { push: (...args: any[]) => void; gtag: (...args: any[]) => void; options: { googleAds: { isActive: boolean } }; getConversionLabel: () => string; };
  Integration?: {
    debug?: boolean;
    data: {
      countryCode?: string;
      ia?: string;
    };
    list: Record<string, any>;
    init: (payload: { countryCode?: string; list?: Record<string, any> }) => { script: string[]; noscript: string[] };
    loadScripts: (scripts: string[]) => void;
  };
}
