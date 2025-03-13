import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import importHtml from './plugins/importHtml';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.prod.ts',
      name: 'ZotloCheckout',
      fileName(format) {
        const baseName = 'zotlo-checkout';

        switch(format) {
          case 'iife':
            return `${baseName}.min.js`;
          case 'es':
            return `${baseName}.js`;
          case 'umd':
            return `${baseName}.umd.cjs`;
          default:
            return `${baseName}.${format}.js`;
        }
      },
      formats: ['es', 'umd', 'iife']
    }
  },
  plugins: [
    tailwindcss(),
    importHtml()
  ]
});
