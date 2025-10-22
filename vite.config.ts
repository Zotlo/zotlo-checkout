import { defineConfig } from 'vite';
import dts from "vite-plugin-dts";
import { minifyPublicJsPlugin } from './plugins/minifyPublicJs';
import packageJson from './package.json';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_NAME__: JSON.stringify(packageJson.name)
  },
  build: {
    lib: {
      entry: 'src/zotlo-checkout.ts',
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
    },
  },
  plugins: [
    dts(),
    minifyPublicJsPlugin()
  ]
});
