import path from 'path'
import { fileURLToPath } from 'url'
import { build } from 'vite';
import dts from "vite-plugin-dts";
import { minifyPublicJsPlugin } from './plugins/minifyPublicJs.ts';
import packageJson from './package.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modeParam = process.argv.find((arg) => arg === '--mode');
const mode = modeParam ? process.argv[process.argv.indexOf(modeParam) + 1] : 'production';
const entryPoints: { entry: string; name: string; formats?: ('es' | 'umd' | 'iife')[] }[] = [
  { entry: 'src/zotlo-checkout.ts', name: 'ZotloCheckout'},
  { entry: 'src/zotlo-card.ts', name: 'ZotloCard'},
  // Isolated Sentry chunk, loaded on demand by Logger.loadSentry()
  { entry: 'src/zotlo-sentry.ts', name: '__zotloSentry', formats: ['iife'] }
];

for await (const [index, item] of Object.entries(entryPoints)) {
  await build({
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __APP_NAME__: JSON.stringify(packageJson.name),
      // Strip Sentry SDK debug-logging code from the zotlo-sentry chunk
      __SENTRY_DEBUG__: 'false'
    },
    mode,
    build: {
      lib: {
        name: item.name,
        entry: path.resolve(__dirname, item.entry),
        fileName(format, entryName) {
          switch(format) {
            case 'iife':
              return `${entryName}.min.js`;
            case 'es':
              return `${entryName}.js`;
            case 'umd':
              return `${entryName}.umd.cjs`;
            default:
              return `${entryName}.${format}.js`;
          }
        },
        formats: item.formats ?? ['es', 'umd', 'iife'],
      },
      emptyOutDir: index === '0',
      copyPublicDir: index === '0',
    },
    plugins: [
      dts(),
      index === '0' ? minifyPublicJsPlugin() : undefined
    ]
  })
};
