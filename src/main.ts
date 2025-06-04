import './css/style.css'
import { ZotloCheckout } from './lib'

(async () => {
  const checkout = await ZotloCheckout({
    token: '123ASDASsqasdas=',
    packageId: 'zotlo-123',
    language: 'en',
    subscriberId: '',
    returnUrl: '',
    events: {
      onLoad(config) {
        const defaultBG = config?.backgroundColor || window.getComputedStyle(document.body).backgroundColor;
        if (defaultBG) {
          document.body.style.backgroundColor = config?.backgroundColor || defaultBG;
        }
      },
      onSubmit() {},
      onSuccess() {},
      onFail(e) {
        (window as any)?.VueApp?.addToaster('Error', e?.message)
      },
    }
  });
  
  checkout.mount('zotlo-checkout')
})()
