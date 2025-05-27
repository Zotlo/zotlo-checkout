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
      onLoad() {},
      onSubmit() {},
      onSuccess() {},
      onFail(e) {
        (window as any)?.VueApp?.addToaster('Error', e?.message)
      },
    }
  });
  
  checkout.mount('zotlo-checkout')
})()
