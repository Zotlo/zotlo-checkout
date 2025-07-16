# Zotlo Checkout
[![Publish Package to npm](https://github.com/Zotlo/zotlo-checkout/actions/workflows/main.yml/badge.svg?branch=master)](https://github.com/Zotlo/zotlo-checkout/actions/workflows/main.yml)

Zotlo Checkout SDK lets you create fast and secure payment pages for mobile apps, games, SaaS platforms, and websites. Launch hosted checkout links in seconds—no code needed—or embed a fully branded checkout flow with just a few lines of code.

## Quick Start

### Install your project
Install `zotlo-checkout` to your project

```bash
npm install zotlo-checkout
```

Add initial script on your project

```javascript
import 'zotlo-checkout/dist/zotlo-checkout.css'; // Import where you want
import ZotloCheckout from 'zotlo-checkout';

// Initialize checkout
const checkout = await ZotloCheckout({
  token: 'YOUR_CHECKOUT_TOKEN',
  packageId: 'YOUR_PACKAGE_ID',
  returnUrl: 'YOUR_RETURN_URL',
  language: 'en',
  events: {
    onSuccess() {
      // Handle success here
    },
    onFail() {
      // Handle fails here
    }
  }
});

// Render form whenever you want
checkout.mount('zotlo-checkout')
```

### Use on CDN
Add the Zotlo Checkout SDK inside the head tag:

**unpkg**
```html
<link rel="stylesheet" href="https://unpkg.com/zotlo-checkout/dist/zotlo-checkout.css" />
<script src="https://unpkg.com/zotlo-checkout/dist/zotlo-checkout.min.js"></script>
```
or

**jsdelivr**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/zotlo-checkout/dist/zotlo-checkout.css" />
<script src="https://cdn.jsdelivr.net/npm/zotlo-checkout/dist/zotlo-checkout.min.js"></script>
```

And start Zotlo Checkout:

```html
<div id="zotlo-checkout"></div>

<script>
  ZotloCheckout({
    token: 'YOUR_CHECKOUT_TOKEN',
    packageId: 'YOUR_PACKAGE_ID',
    returnUrl: 'YOUR_RETURN_URL',
    language: 'en',
    events: {
      onSuccess() {
        // Handle success here
      },
      onFail() {
        // Handle fails here
      }
    }
  }).then(function (checkout) {
    checkout.mount('zotlo-checkout');
  })
</script>
```

## Parameters

| Name                  | Required | Description                                  |
|-----------------------|----------|----------------------------------------------|
| `token`               | **true** | Checkout token you receive via Zotlo Console |
| `packageId`           | **true** | Package id that you want to use              |
| `returnUrl`           | **true** | Return address for success/fail scenarios    |
| `subscriberId`        | false    | Default subscriber id for registration       |
| `style`               | false    | Custom styling on config                     |
| `events`              | false    | Checkout handlers                            |
| `events.onLoad`       | false    | Triggers after form loaded                   |
| `events.onSubmit`     | false    | Triggers after form submitted                |
| `events.onSuccess`    | false    | Handle actions after sucessfull payment      |
| `events.onFail`       | false    | Handle actions after payment failed          |

## Methods
After initialized checkout form, you can use these methods:

### mount
Render checkout form
```typescript
checkout.mount(containerId: string);
```

### refresh
Refresh checkout form
```typescript
checkout.refresh(): Promise<void>;
```

### unmount
Destroy checkout form
```typescript
checkout.unmount();
```

## Styling
You can customize your form on config with `style` parameter. If you do not define any parameters, the settings made in the Zotlo Console will apply by default.

```javascript
{
  ...,
  style: {
    design: {
      theme: 'mobileapp',
      borderWidth: 2,
      backgroundColor: '#CCCCCC',
      ...
    },
    success: {
      show: true,
      waitTime: 20
      ...
    }
  }
}
```

You can see all configs below:

### General Form Design (`style.design`)
```typescript
type FormDesign = {
  /** Default: `vertical` */
  theme: 'horizontal' | 'vertical' | 'mobileapp';
  darkMode: boolean;
  /** You can set any Google fonts (eg. "Montserrat", sans-serif)  */
  fontFamily: string;
  borderColor: string;
  backgroundColor: string;
  borderRadius: number | string;
  borderWidth: number | string;
  /** Available for theme mobileapp */
  header: { show: boolean; };
  product: {
    showProductTitle: boolean;
    /** If `showProductTitle` sets `false`, this will be ignored */
    showSubtotalText: boolean;
    productImage: {
      show: boolean;
      url: string;
    };
    additionalText: {
      show: boolean;
      /** Language ISO code and its translation. (eg. `{ en: "Bonus +5%", pt_bz: "Bônus de 5%" }`) */
      text: Record<string, string>;
    };
  };
  label: {
    show: boolean;
    color: string;
    fontSize: number | string;
    textStyle: {
      bold: boolean;
      italic: boolean;
      underline: boolean;
    };
  };
  consent: {
    color: string;
    fontSize: number | string;
    textStyle: {
      bold: boolean;
      italic: boolean;
      underline: boolean;
    };
  };
  totalPriceColor: string;
  button: {
    color: string;
    borderColor: string;
    backgroundColor: string;
    borderRadius: number | string;
    borderWidth: number | string;
    textStyle: {
      bold: boolean;
      italic: boolean;
      underline: boolean;
    };
    hover: {
      color: string;
      borderColor: string;
      backgroundColor: string;
    };
    text: {
      /**
       * ```
       * 0: "Start Trial"
       * 1: "Start {{TRIAL_PERIOD}} Trial"
       * ```
      */
      trialActivationState: 0 | 1 | string;
      /**
       * ```
       * 0: "Start Now"
       * 1: "Subscribe Now"
       * 2: "Get Started"
       * 3: "Activate Now"
       * 4: "Subscribe for {{PRICE}}"
       * 5: "Get Started for {{PRICE}}"
       * 6: "Subscribe Now for {{DAILY_PRICE}} per day"
       * 7: "Start Now for {{DAILY_PRICE}} per day"
       * ```
       */
      subscriptionActivationState: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | string;
      /**
       * ```
       * 0: "Buy Now"
       * 1: "Pay Now"
       * 2: "Complete Payment"
       * ```
       */
      onetimePayment: 0 | 1 | 2 | string;
    }
  };
  footer: {
    color: string;
    fontSize: number | string;
  };
}
```

### Payment Success Configs (`style.success`)

```typescript
export type FormSuccess = {
  show: boolean;
  /** In seconds. Min: 5, Max: 50, Default: 10  */
  waitTime: number;
  autoRedirect: boolean;
  theme: 'app2web' | 'web2app';
  /** This is available if theme is web2app */
  genericButton: {
    show: boolean;
    /**
     * ```
     * 0: "Go to App"
     * 1: "Go to Web"
     * ```
    */
    text: 0 | 1 | string;
  };
  /** If there is no url for store button (ex. google), this button cannot visible */
  storeButtons: {
    google: boolean;
    apple: boolean;
    amazon: boolean;
    microsoft: boolean;
    huawei: boolean;
  };
  color: string;
  button: {
    /**
     * ```
     * 0: "Back to App"
     * 1: "Back to Game"
     * ```
    */
    text: 0 | 1 | string;
    color: string;
    borderColor: string;
    backgroundColor: string;
    borderRadius: number | string;
    borderWidth: number | string;
    textStyle: {
      bold: boolean;
      italic: boolean;
      underline: boolean;
    };
    hover: {
      color: string;
      borderColor: string;
      backgroundColor: string;
    };
  };
}
```
