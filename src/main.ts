import './css/style.css'
import { ZotloCheckout } from './lib'

(async () => {
  const checkout = await ZotloCheckout({
    token: '123ASDASsqasdas=',
    packageId: 'zotlo-123',
    language: 'en',
    subscriberId: '',
    events: {
      onLoad() {
        console.log('DONE DEV!')
      },
      onSubmit() {}
    }
  });
  
  checkout.mount('zotlo-checkout')
})()
