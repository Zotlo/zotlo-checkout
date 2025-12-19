import { defineConfig } from 'vite';
import dts from "vite-plugin-dts";
import { minifyPublicJsPlugin } from './plugins/minifyPublicJs';
import packageJson from './package.json';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_NAME__: JSON.stringify(packageJson.name)
  },
  plugins: [
    dts(),
    minifyPublicJsPlugin()
  ]
});
