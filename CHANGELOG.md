# Changelog

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
