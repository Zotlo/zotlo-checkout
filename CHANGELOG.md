# Changelog

## v1.18.2

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.18.1...v1.18.2)

### 🩹 Fixes

- **Z3-6533:** Apple Pay session lifecycle and Google Pay mobile validation bypass ([298f8d6](https://github.com/Zotlo/zotlo-checkout/commit/298f8d6))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.18.1

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.18.0...v1.18.1)

### 🩹 Fixes

- Harden Apple Pay and Google Pay flows against missing provider configs ([474f000](https://github.com/Zotlo/zotlo-checkout/commit/474f000))

### 🏡 Chore

- Bump to v1.18.1 ([fa42c50](https://github.com/Zotlo/zotlo-checkout/commit/fa42c50))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.18.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.17.2...v1.18.0)

### 🚀 Enhancements

- **Z3-6265:** Prevent sending InitiateCheckout event if payment success ([f2b3cb6](https://github.com/Zotlo/zotlo-checkout/commit/f2b3cb6))
- **Z3-6265:** Fix the issue that cannot get session id on integration.js if session is started with cookie ([b9ba76a](https://github.com/Zotlo/zotlo-checkout/commit/b9ba76a))
- **Z3-6518:** Show price table view by a flag ([957e07f](https://github.com/Zotlo/zotlo-checkout/commit/957e07f))
- **Z3-6518:** Fix translations for multiple periods ([35cb7a1](https://github.com/Zotlo/zotlo-checkout/commit/35cb7a1))
- **Z3-6518:** Fix the issue that  first-billing-cycle calculation on label ([a2dfebd](https://github.com/Zotlo/zotlo-checkout/commit/a2dfebd))
- **Z3-6518:** Show 7-day instead of 1-week for trial on price-table ([78be752](https://github.com/Zotlo/zotlo-checkout/commit/78be752))
- **Z3-6518:** Hide trial info on price-table if user already used before. ([53299dc](https://github.com/Zotlo/zotlo-checkout/commit/53299dc))

### 🩹 Fixes

- **Z3-6415:** Redirect to deep link for checkout link if payment success screen is hidden ([035e387](https://github.com/Zotlo/zotlo-checkout/commit/035e387))
- **Z3-6465:** Fix the issue that cannot hide form if there is no available payment method ([0d1de13](https://github.com/Zotlo/zotlo-checkout/commit/0d1de13))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.17.2

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.17.1...v1.17.2)

### 🩹 Fixes

- **Z3-6506:** Fixes rtl problems on price-table ([ccf7954](https://github.com/Zotlo/zotlo-checkout/commit/ccf7954))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.17.1

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.17.0...v1.17.1)

### 🩹 Fixes

- **Z3-6502:** Fix the issue that cannot click discount button if form loading state ends ([e88e0a0](https://github.com/Zotlo/zotlo-checkout/commit/e88e0a0))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.17.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.16.0...v1.17.0)

### 🚀 Enhancements
- **Z3-6333:** normalize value in required validation rule ([bc9d786](https://github.com/Zotlo/zotlo-checkout/commit/bc9d786))
- **Z3-6450:** Implements price table to clear pricing confusions - show trial price and discounts - show billing cycle and start date - show subscription payment and start date ([896d016](https://github.com/Zotlo/zotlo-checkout/commit/896d016))
- **Z3-6450:** Refactor footer text ([035e5c0](https://github.com/Zotlo/zotlo-checkout/commit/035e5c0))
- **Z3-6451:** Apply style by config ([e52a715](https://github.com/Zotlo/zotlo-checkout/commit/e52a715))
- **Z3-6451:** Update default theme config for price-info-card ([82ea1c5](https://github.com/Zotlo/zotlo-checkout/commit/82ea1c5))
- **Z3-6451:** Update button text path for checkout form ([e97d674](https://github.com/Zotlo/zotlo-checkout/commit/e97d674))
- **Z3-6450:** Add statement name on footer ([25aa20f](https://github.com/Zotlo/zotlo-checkout/commit/25aa20f))
- **Z3-6450:** Show additional text only mobileapp theme on price-info-card ([7e9474b](https://github.com/Zotlo/zotlo-checkout/commit/7e9474b))
- **Z3-6450:** Update button text parameters by item ([e6b2352](https://github.com/Zotlo/zotlo-checkout/commit/e6b2352))
- **Z3-6450:** Show one-time discount as recurring cycle ([d8235cb](https://github.com/Zotlo/zotlo-checkout/commit/d8235cb))
- **Z3-6450:** Update footer text by Russia ([f8bb56b](https://github.com/Zotlo/zotlo-checkout/commit/f8bb56b))
- **Z3-6450:** Update billing logic to handle trial and discount conditions ([8cc2bd0](https://github.com/Zotlo/zotlo-checkout/commit/8cc2bd0))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))
- omeersari ([@omeersari](https://github.com/omeersari))

## v1.16.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.15.0...v1.16.0)

### 🚀 Enhancements
- **Z3-6350**: feature/Z3-6350: add pix payment process ([a2b3331](https://github.com/Zotlo/zotlo-checkout/commit/a2b3331))

### ❤️ Contributors

- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.15.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.14.0...v1.15.0)

### 🚀 Enhancements
- **Z3-6346**: remove zip code field and related validation from checkout process ([200a1c6](https://github.com/Zotlo/zotlo-checkout/commit/200a1c6))

### ❤️ Contributors

- omeersari ([@omeersari](https://github.com/omeersari))

## v1.14.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.13.0...v1.14.0)


### 🚀 Enhancements
- **Z3-6182**: hide mnp logo except Russia ([efb1f8d](https://github.com/Zotlo/zotlo-checkout/commit/efb1f8d))

### 🩹 Fixes
- **Z3-6408:** Fix the issue that cannot pass validation if input is autofilled ([c224157](https://github.com/Zotlo/zotlo-checkout/commit/c224157))
- **Z3-6278**: update business purchase check to respect user modification permissions ([3c77f7b](https://github.com/Zotlo/zotlo-checkout/commit/3c77f7b))
- **Z3-6278**: enhance payload preparation with business purchase check ([8f34e92](https://github.com/Zotlo/zotlo-checkout/commit/8f34e92))
- **Z3-6279**: remove size class from input hint to avoid user class conflicts ([96fd5ac](https://github.com/Zotlo/zotlo-checkout/commit/96fd5ac))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))
- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))
- omersaritech ([@omersaritech](https://github.com/omersaritech))

## v1.13.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.12.0...v1.13.0)

### 🚀 Enhancements
- **Z3-6315:** add address line to footer info ([51582df](https://github.com/Zotlo/zotlo-checkout/commit/ce62f28))

### ❤️ Contributors

- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.12.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.11.0...v1.12.0)

### 🚀 Enhancements

- **Z3-6052:** Add/send discount-code-entry flag ([51582df](https://github.com/Zotlo/zotlo-checkout/commit/51582df))
- **Z3-6052:** Pass missing param to init config ([94eaec0](https://github.com/Zotlo/zotlo-checkout/commit/94eaec0))
- **Z3-6052:** Update README ([b5417c5](https://github.com/Zotlo/zotlo-checkout/commit/b5417c5))
- **Z3-6053:** Implement discount code functionality and UI components ([2754b9b](https://github.com/Zotlo/zotlo-checkout/commit/2754b9b))
- **Z3-6053:** Prevent applying discount code on edit mode ([c2e917c](https://github.com/Zotlo/zotlo-checkout/commit/c2e917c))
- **Z3-6053:** Update discount types to fix preview issue ([6a86d7b](https://github.com/Zotlo/zotlo-checkout/commit/6a86d7b))
- **Z3-6053:** Update discount code input handling with uppercase transformation ([0c38dee](https://github.com/Zotlo/zotlo-checkout/commit/0c38dee))
- **Z3-6053:** Wait for payment data before getting provider configs for syncing prices ([68b6f82](https://github.com/Zotlo/zotlo-checkout/commit/68b6f82))
- **Z3-6068:** Update footer price info conditions for discounted prices ([6af29f1](https://github.com/Zotlo/zotlo-checkout/commit/6af29f1))
- **Z3-6124:** Enhance payment details with plan, quantity and discount infos ([f9fe4d3](https://github.com/Zotlo/zotlo-checkout/commit/f9fe4d3))
- **Z3-6124:** Update payment details discount section for panel edit mode ([71e6cb9](https://github.com/Zotlo/zotlo-checkout/commit/71e6cb9))
- **Z3-6124:** Check for real discount for discount info on payment details ([dd11659](https://github.com/Zotlo/zotlo-checkout/commit/dd11659))
- **Z3-6124:** Use package base prices for plan info on payment details ([66cdda0](https://github.com/Zotlo/zotlo-checkout/commit/66cdda0))
- **Z3-6158:** Update discount info on form and payment details ([652bb52](https://github.com/Zotlo/zotlo-checkout/commit/652bb52))
- **Z3-6158:** Update discount info by trial transaction status ([a2f8e00](https://github.com/Zotlo/zotlo-checkout/commit/a2f8e00))
- **Z3-6158:** Add isTrialUsed condition for discount after trial ([f5772a4](https://github.com/Zotlo/zotlo-checkout/commit/f5772a4))
- **Z3-6158:** Add conditions for discount info for free trial ([8103585](https://github.com/Zotlo/zotlo-checkout/commit/8103585))

### ❤️ Contributors

- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))
- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.11.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.10.1...v1.11.0)

### 🚀 Enhancements

- Add paypal payrails integrations ([db359c3](https://github.com/Zotlo/zotlo-checkout/commit/db359c3))
- Implement conditional paypal integration based on useNewPayPal flag ([f46ef9b](https://github.com/Zotlo/zotlo-checkout/commit/f46ef9b))
- Add extra clientId and merchantId checks for new paypal ([23c11f0](https://github.com/Zotlo/zotlo-checkout/commit/23c11f0))
- **Z3-5872:** Add quantitySetting types ([3e0b44f](https://github.com/Zotlo/zotlo-checkout/commit/3e0b44f))
- **Z3-5868:** Add agreegator link to footer ([ee1d573](https://github.com/Zotlo/zotlo-checkout/commit/ee1d573))
- **Z3-5872:** Update total price display logic with quantity info ([6677d2d](https://github.com/Zotlo/zotlo-checkout/commit/6677d2d))
- **Z3-5872:** Add fallback for total payable amount without package ([7f54f5c](https://github.com/Zotlo/zotlo-checkout/commit/7f54f5c))
- **Z3-5955:** Remove agree-policy checkbox and its modal events ([3c6f496](https://github.com/Zotlo/zotlo-checkout/commit/3c6f496))
- **Z3-5955:** Refactor terms and privacy text on footer ([dad2518](https://github.com/Zotlo/zotlo-checkout/commit/dad2518))
- **Z3-5872:** Add quantitySetting as config param ([9a9c903](https://github.com/Zotlo/zotlo-checkout/commit/9a9c903))
- **Z3-5872:** Fix quantity info template location ([7ff397a](https://github.com/Zotlo/zotlo-checkout/commit/7ff397a))
- **Z3-5930:** Remove paypal sdk integrations and related configs ([edc8d23](https://github.com/Zotlo/zotlo-checkout/commit/edc8d23))

### 🩹 Fixes

- **Z3-5977:** Fix the issue that reset subscriberId and zipcode input if user change active payment tab ([6e752e3](https://github.com/Zotlo/zotlo-checkout/commit/6e752e3))
- Add mode parameter for production build ([f928ec0](https://github.com/Zotlo/zotlo-checkout/commit/f928ec0))

### 🏡 Chore

- Remove button element description section ([75bbbd7](https://github.com/Zotlo/zotlo-checkout/commit/75bbbd7))

### ❤️ Contributors

- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))
- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.10.1

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.10.0...v1.10.1)

### 🩹 Fixes

- Replace unmount with destroyFormInputs for proper cleanup in ZotloCard and ZotloCheckout ([c29ea88](https://github.com/Zotlo/zotlo-checkout/commit/c29ea88))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.10.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.9.1-1...v1.10.0)

### 🚀 Enhancements

- Refactor to send all google data for payrails request ([b52b37d](https://github.com/Zotlo/zotlo-checkout/commit/b52b37d))
- **Z3-5862:** Implemente billing form for checkout ([d521876](https://github.com/Zotlo/zotlo-checkout/commit/d521876))
- **Z3-5862:** Make zipcode input as optional if user is not in US ([889e947](https://github.com/Zotlo/zotlo-checkout/commit/889e947))
- **Z3-5862:** Send detected country code in billing info ([7c5583c](https://github.com/Zotlo/zotlo-checkout/commit/7c5583c))
- **Z3-5862:** Update checkbox styles and HTML structure for consistency ([327c92a](https://github.com/Zotlo/zotlo-checkout/commit/327c92a))
- **Z3-5862:** Make taxId as optional ([0123a4f](https://github.com/Zotlo/zotlo-checkout/commit/0123a4f))
- **Z3-5862:** Add translation for country field ([77896dc](https://github.com/Zotlo/zotlo-checkout/commit/77896dc))
- **Z3-5862:** Refactor billing field handling and validation logic ([a2a8b95](https://github.com/Zotlo/zotlo-checkout/commit/a2a8b95))
- **Z3-5862:** Update zip code requirement logic based on configuration ([d1fe344](https://github.com/Zotlo/zotlo-checkout/commit/d1fe344))
- **Z3-5862:** Remove validation and mask on zipcode input except US ([c06283a](https://github.com/Zotlo/zotlo-checkout/commit/c06283a))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))
- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.9.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.8.1...v1.9.0)

### 🚀 Enhancements

- Add ZotloCard method to update user card ([8cbea63](https://github.com/Zotlo/zotlo-checkout/commit/8cbea63))
- Update themes for zotlo-card form ([d1860fc](https://github.com/Zotlo/zotlo-checkout/commit/d1860fc))
- Hide header if the form is card update ([8ecb201](https://github.com/Zotlo/zotlo-checkout/commit/8ecb201))
- Prepare success page for card upate form ([68134ec](https://github.com/Zotlo/zotlo-checkout/commit/68134ec))
- Add business-purchase type in design model ([4122e1b](https://github.com/Zotlo/zotlo-checkout/commit/4122e1b))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.8.1

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.8.0...v1.8.1)

### 💅 Refactors

- Remove form result on onSbmit callback ([d3fdbda](https://github.com/Zotlo/zotlo-checkout/commit/d3fdbda))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.8.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.7.0...v1.8.0)

### 🚀 Enhancements

- Add saved card list UI and refactor credit card form ([58f698b](https://github.com/Zotlo/zotlo-checkout/commit/58f698b))
- Update card item styles to adapt for dark mode ([493091e](https://github.com/Zotlo/zotlo-checkout/commit/493091e))
- Add saved card flow integrations ([d3169c8](https://github.com/Zotlo/zotlo-checkout/commit/d3169c8))
- Add saved card modal UI and integrations ([c35081b](https://github.com/Zotlo/zotlo-checkout/commit/c35081b))
- Update zotlo account url in all cards modal ([946b7ba](https://github.com/Zotlo/zotlo-checkout/commit/946b7ba))
- Add maskCardNumber helper ([00d5345](https://github.com/Zotlo/zotlo-checkout/commit/00d5345))

### 🩹 Fixes

- Adapt card item number color for dark mode ([90066b1](https://github.com/Zotlo/zotlo-checkout/commit/90066b1))
- Adapt card number color for dark mode on payment form ([2334182](https://github.com/Zotlo/zotlo-checkout/commit/2334182))
- Add disabled attr for expired cards radio input ([b619f14](https://github.com/Zotlo/zotlo-checkout/commit/b619f14))

### 🏡 Chore

- Control for sentry client ([be368f4](https://github.com/Zotlo/zotlo-checkout/commit/be368f4))
- Refactor sentry loader ([0c04487](https://github.com/Zotlo/zotlo-checkout/commit/0c04487))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))
- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.7.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.6.0...v1.7.0)

### 🚀 Enhancements

- Initialize Sentry integration ([0cbfc9d](https://github.com/Zotlo/zotlo-checkout/commit/0cbfc9d))
- Add logger to some critical methods ([d22e2ac](https://github.com/Zotlo/zotlo-checkout/commit/d22e2ac))
- Prevent sentry load for development ([6517fed](https://github.com/Zotlo/zotlo-checkout/commit/6517fed))
- Prevent logger load if api sdk is not found ([95381e6](https://github.com/Zotlo/zotlo-checkout/commit/95381e6))
- Clear session if user redirect to outside ([a2616d4](https://github.com/Zotlo/zotlo-checkout/commit/a2616d4))

### 🏡 Chore

- Remove api response logs ([b5d17a8](https://github.com/Zotlo/zotlo-checkout/commit/b5d17a8))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.6.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.5.4...v1.6.0)

### 🚀 Enhancements

- Add zip code input and controls ([97bc00d](https://github.com/Zotlo/zotlo-checkout/commit/97bc00d))
- Add payment header for all themes and adjust styles ([2ac77ce](https://github.com/Zotlo/zotlo-checkout/commit/2ac77ce))

### 🩹 Fixes

- Stop payment process if registration has error ([53cdd06](https://github.com/Zotlo/zotlo-checkout/commit/53cdd06))
- Change registration order on google pay process ([b29c09f](https://github.com/Zotlo/zotlo-checkout/commit/b29c09f))

### 🏡 Chore

- Add details for events object on README ([f30e157](https://github.com/Zotlo/zotlo-checkout/commit/f30e157))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))
- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.5.4

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.5.3...v1.6.0)

### 🩹 Fixes

- Bump to v1.5.4 ([cec6f01](https://github.com/Zotlo/zotlo-checkout/commit/cec6f01))
- handle gpay button create action ([e5a12f0](https://github.com/Zotlo/zotlo-checkout/commit/e5a12f0))
  - add missing onClick parameter to createButton
  - set client-domain header primarily with hostname

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.5.3

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.5.2...v1.5.3)

### 🚀 Enhancements

- Add Client-Domain to requests header ([2076a66](https://github.com/Zotlo/zotlo-checkout/commit/2076a66))

### ❤️ Contributors

- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.5.2

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.5.1...v1.5.2)

### 🩹 Fixes

- Redirect to returnUrl in non-redirect payments ([230bfd9](https://github.com/Zotlo/zotlo-checkout/commit/230bfd9))
- Add parametric session management ([5b2b501](https://github.com/Zotlo/zotlo-checkout/commit/5b2b501))

### ❤️ Contributors

- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.5.1

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.5.0...v1.6.0)

### 💅 Refactors

- Manage session on localStorage instead of cookie ([75f0add](https://github.com/Zotlo/zotlo-checkout/commit/75f0add))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.5.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.4.3...v1.5.0)

### 🚀 Enhancements

- Send custom parameters to webhooks ([dbdf00e](https://github.com/Zotlo/zotlo-checkout/commit/dbdf00e))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.4.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.3.0...v1.4.0)

### 🚀 Enhancements

- Add payment details section on payment success page ([3d315b8](https://github.com/Zotlo/zotlo-checkout/commit/3d315b8))

### 🩹 Fixes

- Update sandbox band z-index value to prevent overflow problem with toaster ([3524e82](https://github.com/Zotlo/zotlo-checkout/commit/3524e82))
- Add country code control for consent-mandatory countries ([e611723](https://github.com/Zotlo/zotlo-checkout/commit/e611723))

### 🏡 Chore

- Update demo ([f51b603](https://github.com/Zotlo/zotlo-checkout/commit/f51b603))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))
- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.3.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.2.0...v1.3.0)

### 🚀 Enhancements

- Add sandbox strip to html files ([ae975cd](https://github.com/Zotlo/zotlo-checkout/commit/ae975cd))
- Seperate form submit by provider ([c82db4b](https://github.com/Zotlo/zotlo-checkout/commit/c82db4b))

### 🩹 Fixes

- Prevent button submit action for google pay button ([d7204b9](https://github.com/Zotlo/zotlo-checkout/commit/d7204b9))
- Refactor sandbox strip html ([aba70bf](https://github.com/Zotlo/zotlo-checkout/commit/aba70bf))
- Update onClickSubmitButton event type to fix build issue ([7e69e37](https://github.com/Zotlo/zotlo-checkout/commit/7e69e37))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))
- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.2.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.1.0...v1.2.0)

### 🚀 Enhancements

- Skip google/apple payment actions if sandbox mode is active ([1dac44b](https://github.com/Zotlo/zotlo-checkout/commit/1dac44b))
- Add mock payment parameters for Apple and Google payments if sandbox mode is active ([83bf8e5](https://github.com/Zotlo/zotlo-checkout/commit/83bf8e5))
- Add custom style config ([a746635](https://github.com/Zotlo/zotlo-checkout/commit/a746635))
- Refresh provider configs after any checkout error ([824ee4c](https://github.com/Zotlo/zotlo-checkout/commit/824ee4c))
- Add disabled form functionality ([8635c8b](https://github.com/Zotlo/zotlo-checkout/commit/8635c8b))
- Add subscriberId input actions for registration before payment ([1780aa5](https://github.com/Zotlo/zotlo-checkout/commit/1780aa5))
- Add analytic integrations ([544524c](https://github.com/Zotlo/zotlo-checkout/commit/544524c))
- Add dynamic price values by subscription status ([ed9ec75](https://github.com/Zotlo/zotlo-checkout/commit/ed9ec75))
- Add custom title for page_view ([7d21d48](https://github.com/Zotlo/zotlo-checkout/commit/7d21d48))
- Add close on header ([365f9df](https://github.com/Zotlo/zotlo-checkout/commit/365f9df))
- Hide text-decoration on header close button ([8739bea](https://github.com/Zotlo/zotlo-checkout/commit/8739bea))

### 🩹 Fixes

- Set store buttons by web2app ([22a7e82](https://github.com/Zotlo/zotlo-checkout/commit/22a7e82))
- Fix the issue that cannot view button text styles on payment success ([45fd0d1](https://github.com/Zotlo/zotlo-checkout/commit/45fd0d1))
- Add fail callback in main.ts ([afd9e91](https://github.com/Zotlo/zotlo-checkout/commit/afd9e91))
- Add type assertion for providers in loadProviderSDKs function ([e7ab719](https://github.com/Zotlo/zotlo-checkout/commit/e7ab719))

### 🏡 Chore

- Reactor mergeDeep utils for unexpected mutations ([f121e06](https://github.com/Zotlo/zotlo-checkout/commit/f121e06))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))
- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))

## v1.1.0

[compare changes](https://github.com/Zotlo/zotlo-checkout/compare/v1.0.1...v1.1.0)

### 🚀 Enhancements

- Integrate google pay payment process ([165dd40](https://github.com/Zotlo/zotlo-checkout/commit/165dd40))
- Apply success configs ([a424860](https://github.com/Zotlo/zotlo-checkout/commit/a424860))
- Hide subtotal row if product name has not available ([1c68b92](https://github.com/Zotlo/zotlo-checkout/commit/1c68b92))
- Add callback for additonal text ([2f3bf25](https://github.com/Zotlo/zotlo-checkout/commit/2f3bf25))
- Open legal links on new tab ([b8d86cb](https://github.com/Zotlo/zotlo-checkout/commit/b8d86cb))
- Refactor getPackageTemplateParams parameter control ([620e4af](https://github.com/Zotlo/zotlo-checkout/commit/620e4af))
- Calculate discount price and show on form ([832b967](https://github.com/Zotlo/zotlo-checkout/commit/832b967))
- Hide subscriberId on input if registerType is other ([f373bc2](https://github.com/Zotlo/zotlo-checkout/commit/f373bc2))
- Show error on form ([bf6aaa1](https://github.com/Zotlo/zotlo-checkout/commit/bf6aaa1))
- Update payment success icon ([2c08cb1](https://github.com/Zotlo/zotlo-checkout/commit/2c08cb1))
- Handle error message on query if payment has failed ([3b1615b](https://github.com/Zotlo/zotlo-checkout/commit/3b1615b))
- Handle Apple and Google pay errors properly ([2ed65cb](https://github.com/Zotlo/zotlo-checkout/commit/2ed65cb))
- Format package name by period type ([927ecd1](https://github.com/Zotlo/zotlo-checkout/commit/927ecd1))
- Add returnUrl for payment init reqs ([b31ea70](https://github.com/Zotlo/zotlo-checkout/commit/b31ea70))
- Add returnUrl for payment session req ([a92cb21](https://github.com/Zotlo/zotlo-checkout/commit/a92cb21))

### 🩹 Fixes

- Handle optional chaining for providerKey in prepareProvider function ([985b1ed](https://github.com/Zotlo/zotlo-checkout/commit/985b1ed))
- Show default price if there is no discount ([d57c4bb](https://github.com/Zotlo/zotlo-checkout/commit/d57c4bb))
- Update OS handling in prepareButtonSuccessLink function ([e2fae89](https://github.com/Zotlo/zotlo-checkout/commit/e2fae89))
- Remove console log ([d574c81](https://github.com/Zotlo/zotlo-checkout/commit/d574c81))
- Always allow subscriberId editing if register type is other ([c8350bb](https://github.com/Zotlo/zotlo-checkout/commit/c8350bb))

### 🏡 Chore

- Update README ([954c491](https://github.com/Zotlo/zotlo-checkout/commit/954c491))

### ❤️ Contributors

- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin))
- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))

## v1.0.0


### 🚀 Enhancements

- Add favicon ([cc57f18](https://github.com/Zotlo/zotlo-checkout/commit/cc57f18))
- Remove id ([5cb4338](https://github.com/Zotlo/zotlo-checkout/commit/5cb4338))
- Add card detection ([e9044d8](https://github.com/Zotlo/zotlo-checkout/commit/e9044d8))
- Add tooltip to input ([4629ebd](https://github.com/Zotlo/zotlo-checkout/commit/4629ebd))
- Add html minify for output ([9f72cd5](https://github.com/Zotlo/zotlo-checkout/commit/9f72cd5))
- Remove tailwindcss ([4a5e699](https://github.com/Zotlo/zotlo-checkout/commit/4a5e699))
- Apply style config ([e445c17](https://github.com/Zotlo/zotlo-checkout/commit/e445c17))
- Add phone number field by config ([96529f9](https://github.com/Zotlo/zotlo-checkout/commit/96529f9))
- Update disclaimer text ([269f32b](https://github.com/Zotlo/zotlo-checkout/commit/269f32b))
- Sort payment methods ([4dd4fc2](https://github.com/Zotlo/zotlo-checkout/commit/4dd4fc2))
- Hide/show paypal by config ([cc9ae9d](https://github.com/Zotlo/zotlo-checkout/commit/cc9ae9d))
- Add localization ([e293e21](https://github.com/Zotlo/zotlo-checkout/commit/e293e21))
- Add form direction by language ([247bcc5](https://github.com/Zotlo/zotlo-checkout/commit/247bcc5))
- Arrange input tooltip position by direction ([5a7742e](https://github.com/Zotlo/zotlo-checkout/commit/5a7742e))
- Add missing default text color ([819a4b5](https://github.com/Zotlo/zotlo-checkout/commit/819a4b5))
- Show no-method-supported message on screen if country/region/device is not supported ([a3ea682](https://github.com/Zotlo/zotlo-checkout/commit/a3ea682))
- Add new parameters ([ba4ee0a](https://github.com/Zotlo/zotlo-checkout/commit/ba4ee0a))
- Add api and cookie helper functions ([9630778](https://github.com/Zotlo/zotlo-checkout/commit/9630778))
- Add checkout config integrations ([38ead58](https://github.com/Zotlo/zotlo-checkout/commit/38ead58))
- Add tab view ([5f87025](https://github.com/Zotlo/zotlo-checkout/commit/5f87025))
- Add control for policy checkbox by flag ([08143a1](https://github.com/Zotlo/zotlo-checkout/commit/08143a1))
- Apply dark mode by flag ([2eb33c0](https://github.com/Zotlo/zotlo-checkout/commit/2eb33c0))
- Add credit card payment process with event callbacks and return url support ([31eb8c6](https://github.com/Zotlo/zotlo-checkout/commit/31eb8c6))
- Hide request for non-production env ([393ed37](https://github.com/Zotlo/zotlo-checkout/commit/393ed37))
- Update paypal visibility by payment init response ([4a44bd3](https://github.com/Zotlo/zotlo-checkout/commit/4a44bd3))
- Add new theme for mobile applications ([daaa0b7](https://github.com/Zotlo/zotlo-checkout/commit/daaa0b7))
- Align top of form if header is not available ([d3d6e02](https://github.com/Zotlo/zotlo-checkout/commit/d3d6e02))
- Clear invalid chars in phone number ([fc4c8d6](https://github.com/Zotlo/zotlo-checkout/commit/fc4c8d6))
- Enhance mobile app theme styles and improve tab button generation logic ([4e59a77](https://github.com/Zotlo/zotlo-checkout/commit/4e59a77))
- Add provider configuration retrieval for apple pay and google pay ([99b4393](https://github.com/Zotlo/zotlo-checkout/commit/99b4393))
- Rename api url env variable ([7ea4e04](https://github.com/Zotlo/zotlo-checkout/commit/7ea4e04))
- Add provider sdks by payment config ([add35b6](https://github.com/Zotlo/zotlo-checkout/commit/add35b6))
- Add payment success screen ([19b6706](https://github.com/Zotlo/zotlo-checkout/commit/19b6706))
- Refactor config settings ([ff1c28f](https://github.com/Zotlo/zotlo-checkout/commit/ff1c28f))
- Hide subscriber input by flag ([0cda0c9](https://github.com/Zotlo/zotlo-checkout/commit/0cda0c9))
- Integrate apple pay payment process ([5cd9856](https://github.com/Zotlo/zotlo-checkout/commit/5cd9856))
- Show an error screen if page cannot load ([4320a60](https://github.com/Zotlo/zotlo-checkout/commit/4320a60))
- Refactor Apple Pay payment check into a separate function ([06859c4](https://github.com/Zotlo/zotlo-checkout/commit/06859c4))
- Implement preparePaymentMethods utility for payment method filtering ([19a4170](https://github.com/Zotlo/zotlo-checkout/commit/19a4170))
- Add app-to-web register bypass ([a09ba11](https://github.com/Zotlo/zotlo-checkout/commit/a09ba11))
- Add toaster for demo and development ([b669eec](https://github.com/Zotlo/zotlo-checkout/commit/b669eec))
- Add pluralization for i18n function ([d2cafe5](https://github.com/Zotlo/zotlo-checkout/commit/d2cafe5))
- Add prices and package params for templates ([3cb02d0](https://github.com/Zotlo/zotlo-checkout/commit/3cb02d0))
- Add form loading state management ([feac776](https://github.com/Zotlo/zotlo-checkout/commit/feac776))
- Refactor registerPaymentUser function to use config and params ([68b03a7](https://github.com/Zotlo/zotlo-checkout/commit/68b03a7))
- Show store download buttons on payment success ([c39417a](https://github.com/Zotlo/zotlo-checkout/commit/c39417a))
- Set default success theme as app2web ([2cf63e1](https://github.com/Zotlo/zotlo-checkout/commit/2cf63e1))
- Show generic button by flag ([12c8639](https://github.com/Zotlo/zotlo-checkout/commit/12c8639))
- Add flag for store buttons ([1c3b799](https://github.com/Zotlo/zotlo-checkout/commit/1c3b799))
- Add agreement modal ([63a2093](https://github.com/Zotlo/zotlo-checkout/commit/63a2093))
- Pass bg color to onLoad callback ([0d85e5a](https://github.com/Zotlo/zotlo-checkout/commit/0d85e5a))
- Add register conditions ([99befa1](https://github.com/Zotlo/zotlo-checkout/commit/99befa1))

### 🩹 Fixes

- Update demo page ([0c65fc8](https://github.com/Zotlo/zotlo-checkout/commit/0c65fc8))
- Apply font-weight property with variable for agreement checkbox ([3a86c74](https://github.com/Zotlo/zotlo-checkout/commit/3a86c74))
- Type for importHtml plugin ([d772038](https://github.com/Zotlo/zotlo-checkout/commit/d772038))
- Typescript lint ([3070eef](https://github.com/Zotlo/zotlo-checkout/commit/3070eef))
- Add type assertion for target in selectItem function ([367108c](https://github.com/Zotlo/zotlo-checkout/commit/367108c))
- Fix the issue that cannot view subscriber-id input if theme is horizontal on credit-card and order is not first ([98bf5fa](https://github.com/Zotlo/zotlo-checkout/commit/98bf5fa))
- Remove unnecessary parameter on catch ([2af8db9](https://github.com/Zotlo/zotlo-checkout/commit/2af8db9))
- Fix the issue that cannot load italic fonts on google fonts ([95a2e40](https://github.com/Zotlo/zotlo-checkout/commit/95a2e40))
- Fix the issue that cannot validate form by providers ([7f6b20a](https://github.com/Zotlo/zotlo-checkout/commit/7f6b20a))
- Set custom pacakge name as primary ([c4c8781](https://github.com/Zotlo/zotlo-checkout/commit/c4c8781))
- Typo on readme ([a9df433](https://github.com/Zotlo/zotlo-checkout/commit/a9df433))

### 🏡 Chore

- Update types ([3fcfc63](https://github.com/Zotlo/zotlo-checkout/commit/3fcfc63))
- Remove order key on payment methods ([cb2c97a](https://github.com/Zotlo/zotlo-checkout/commit/cb2c97a))
- Update settings model ([02a4fe2](https://github.com/Zotlo/zotlo-checkout/commit/02a4fe2))
- Remove status field on payment method settings ([920e578](https://github.com/Zotlo/zotlo-checkout/commit/920e578))
- Ignore env files ([bc6ccf3](https://github.com/Zotlo/zotlo-checkout/commit/bc6ccf3))
- Get page config by env ([aaff239](https://github.com/Zotlo/zotlo-checkout/commit/aaff239))
- Change config variable to const and simplify error handling ([3b82469](https://github.com/Zotlo/zotlo-checkout/commit/3b82469))
- Add github action ([9c18a4d](https://github.com/Zotlo/zotlo-checkout/commit/9c18a4d))
- Change publish branch ([833694c](https://github.com/Zotlo/zotlo-checkout/commit/833694c))

### ❤️ Contributors

- Sinan Mutlu ([@SinanMtl](https://github.com/SinanMtl))
- Yiğit Şahin ([@yiiitsahin](https://github.com/yiiitsahin)) 
