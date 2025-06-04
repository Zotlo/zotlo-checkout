(() => {
  let Vue = globalThis.Vue;
  let ref = Vue.ref;
  let createApp = Vue.createApp;
  let useTemplateRef = Vue.useTemplateRef;

  const icons = {
    errorCircle: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.99996 1.66669C14.6025 1.66669 18.3333 5.39835 18.3333 10C18.3333 14.6017 14.6025 18.3334 9.99996 18.3334C5.39746 18.3334 1.66663 14.6017 1.66663 10C1.66663 5.39835 5.39746 1.66669 9.99996 1.66669ZM9.99996 3.05585C6.17079 3.05585 3.05579 6.17085 3.05579 10C3.05579 13.8292 6.17079 16.9442 9.99996 16.9442C13.8291 16.9442 16.9441 13.8292 16.9441 10C16.9441 6.17085 13.8291 3.05585 9.99996 3.05585ZM9.99885 12.0852C10.4585 12.0852 10.8311 12.4578 10.8311 12.9174C10.8311 13.3771 10.4585 13.7497 9.99885 13.7497C9.53922 13.7497 9.16663 13.3771 9.16663 12.9174C9.16663 12.4578 9.53922 12.0852 9.99885 12.0852ZM9.99534 5.83335C10.3118 5.8331 10.5734 6.06802 10.6151 6.37305L10.6208 6.45785L10.6238 10.2092C10.6241 10.5544 10.3445 10.8344 9.99934 10.8347C9.68293 10.8349 9.42125 10.6 9.37962 10.295L9.37385 10.2102L9.37084 6.45885C9.37057 6.11368 9.65017 5.83363 9.99534 5.83335Z" fill="currentColor"/>
    </svg>`,
    dismiss: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.43306 5.42805C5.67714 5.18398 6.07286 5.18398 6.31694 5.42805L9.99755 9.10866L13.6782 5.42805C13.9222 5.18398 14.318 5.18398 14.562 5.42805C14.8061 5.67213 14.8061 6.06786 14.562 6.31194L10.8814 9.99254L14.562 13.6731C14.8061 13.9172 14.8061 14.313 14.562 14.557C14.318 14.8011 13.9222 14.8011 13.6782 14.557L9.99755 10.8764L6.31694 14.557C6.07286 14.8011 5.67714 14.8011 5.43306 14.557C5.18898 14.313 5.18898 13.9172 5.43306 13.6731L9.11366 9.99254L5.43306 6.31194C5.18898 6.06786 5.18898 5.67213 5.43306 5.42805Z" fill="#04071E"/>
      </svg>`
  }

  const Toaster = {
    template: `
    <div class="toaster">
      <div class="toaster__icon">${icons.errorCircle}</div>
      <div class="toaster__content">
        <div class="toaster__content__title">{{ title }}</div>
        <div class="toaster__content__message">{{ message }}</div>
      </div>
      <button class="toaster__close" @click="$emit('close')">${icons.dismiss}</button>
    </div>`,
    emit: ['close'],
    props: {
      title: { type: String, default: '' },
      message: { type: String, default: '' }
    }
  }

  const ToasterGroup = {
    components: { Toaster },
    template: `<div class="toaster-group">
        <TransitionGroup name="slide-fade" class="toaster-group">
          <Toaster v-for="toast in toasts" :key="toast.id" :title="toast.title" :message="toast.message" @close="removeToast(toast.id)" />
        </TransitionGroup>
    </div>`,
    setup() {
      const toasts = ref([]);

      function removeToast(id) {
        const item = toasts.value.find((toast) => toast.id === id);
        if (item) {
          const index = toasts.value.indexOf(item);
          if (index > -1) toasts.value.splice(index, 1);
        }
      }

      function addToast(title, message, delay) {
        const id = performance.now().toString(36) + Math.random().toString(36).substring(2);
        toasts.value.unshift({ id, title, message });

        setTimeout(() => removeToast(id), delay || 5000);
      }

      return {
        toasts,
        addToast,
        removeToast
      }
    }
  }

  window.VueApp = createApp({
    components: { ToasterGroup, Toaster },
    setup() {
      const toasterGroup = useTemplateRef('toasterGroup')

      function addToaster(title, message, delay) {
        if (toasterGroup.value) toasterGroup.value?.addToast(title, message, delay)
      }

      return { addToaster }
    },
    template: `<ToasterGroup ref="toasterGroup" />`
  }).mount('#app');
})()
