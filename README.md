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
import { ZotloCheckout } from 'zotlo-checkout';

// Initialize checkout
const checkout = await ZotloCheckout({
  token: 'YOUR_CHECKOUT_TOKEN',
  packageId: 'YOUR_PACKAGE_ID',
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
<script src="https://unpkg.com/zotlo-checkout/dist/zotlo-checkout.min.js"></script>
```
or

**jsdelivr**
```html
<script src="https://cdn.jsdelivr.net/npm/zotlo-checkout/dist/zotlo-checkout.min.js"></script>
```

And start Zotlo Checkout:

```html
<div id="zotlo-checkout"></div>

<script>
  ZotloCheckout({
    token: 'YOUR_CHECKOUT_TOKEN',
    packageId: 'YOUR_PACKAGE_ID',
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
| `packageId`           | **true** | Package id that you want to use              |
| `subscriberId`        | false    | Default subscriber id for registration       |
| `returnUrl`           | false    | Return address for success/fail scenarios    |
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
checkout.refresh();
```

### unmount
Destroy checkout form
```typescript
checkout.unmount();
```
