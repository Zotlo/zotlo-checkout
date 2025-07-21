# Zotlo Checkout
[![Publish Package to npm](https://github.com/Zotlo/zotlo-checkout/actions/workflows/main.yml/badge.svg?branch=master)](https://github.com/Zotlo/zotlo-checkout/actions/workflows/main.yml)

Zotlo Checkout SDK allows you to embed a secure payment form directly into your website, providing your customers with a seamless checkout experience without leaving your site.

## Quick Start

### Installation
Add the `zotlo-checkout` package to your project:

#### npm
```bash
npm install zotlo-checkout
```

#### yarn
```bash
yarn add -D zotlo-checkout
```

### Initialize Checkout
```javascript
import 'zotlo-checkout/dist/zotlo-checkout.css';
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
**Note:** The string `'zotlo-checkout'` passed to mount is the id of the DOM element where the form will be embedded, for example:

```html
<div id="zotlo-checkout"></div>
```

### Using via CDN
You can also include Zotlo Checkout SDK directly in the browser using CDN links:

**unpkg**
```html
<link rel="stylesheet" href="https://unpkg.com/zotlo-checkout/dist/zotlo-checkout.css" />
<script src="https://unpkg.com/zotlo-checkout/dist/zotlo-checkout.min.js"></script>
```

**jsdelivr**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/zotlo-checkout/dist/zotlo-checkout.css" />
<script src="https://cdn.jsdelivr.net/npm/zotlo-checkout/dist/zotlo-checkout.min.js"></script>
```

#### Usage example

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
These parameters specify the parameters and descriptions used in the Zotlo Checkout SDK.

| Name                    | Required | Description                                                                                                                  |
|-------------------------|----------|------------------------------------------------------------------------------------------------------------------------------|
| `token`                 | **true** | The checkout token obtained from the Zotlo Console. You can find this in your project's Developer Tools > Checkout SDK page. |
| `packageId`             | **true** | The ID of the package you want to use.                                                                                       |
| `returnUrl`             | **true** | The URL to redirect the user after payment completion.                                                                       |
| `subscriberId`          | false    | (Optional) Default subscriber ID for registration; can be an email, phone number, or UUID v4.                                |
| `style`                 | false    | Custom styling on config                                                                                                     |
| `events`                | false    | Event listeners that can be used during the checkout process.                                                                |
| `events.onLoad`         | false    | Triggers after form loaded.                                                                                                  |
| `events.onSubmit`       | false    | Triggered after the form is submitted.                                                                                       |
| `events.onSuccess`      | false    | Triggered after a successful payment.                                                                                        |
| `events.onFail`         | false    | Triggered when a payment fails.                                                                                              |
| `events.onInvalidForm`  | false    | Triggers when form has an invalid field.                                                                                     |

**Note:** For more details, please visit [types.ts](https://github.com/Zotlo/zotlo-checkout/blob/master/src/lib/types.ts) file.

## Methods
User methods available after Checkout is started:

### mount
Renders the Checkout form to the specified DOM element.
```typescript
checkout.mount(containerId: string);
```

### refresh
Refreshes the form.
```typescript
checkout.refresh(): Promise<void>;
```

### unmount
Removes the form and deletes it from the DOM.
```typescript
checkout.unmount();
```

## Styling
You can customize your form on config with `style` parameter. If you do not define any parameters, the settings made in the [Zotlo Console](https://console.zotlo.com) will apply by default.

**Note:** For more details, please check `IZotloCheckoutStyle` on [types.ts](https://github.com/Zotlo/zotlo-checkout/blob/master/src/lib/types.ts) file.

```javascript
{
  ...
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
