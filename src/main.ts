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
      onLoad() {
        console.log('DONE DEV!')
      },
      onSubmit(e) {
        console.log('Form submit', e);
      },
      onSuccess() {
        console.log('Payment success!');
      },
      onFail(e) {
        console.log('Payment failed!', e);
      },
    }
  });
  
  checkout.mount('zotlo-checkout')
})()
