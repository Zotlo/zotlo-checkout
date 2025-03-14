import fsp from 'fs/promises';
import { PluginOption } from 'vite';
import minify from '@node-minify/core';
import htmlMinifier from '@node-minify/html-minifier';

const htmlFileRegex = /\.html$/;
const postfixRE = /[?#].*$/s

function cleanUrl(url) {
  return url.replace(postfixRE, '')
}

function htmlImportServe(): PluginOption {
  return {
    name: 'html-import:serve',
    apply: 'serve',
    transform(src, id) {
      if (htmlFileRegex.test(id)) {
        return {
          code: `export default ${JSON.stringify(src)}`,
        };
      }
    },
  }
}

function htmlImportBuild(): PluginOption {
  const postfix = '?html-import';

  return {
    name: 'html-import:build',
    enforce: 'pre',
    apply: 'build',
    async resolveId(id, importer, options) {
      if (htmlFileRegex.test(id) && !options.isEntry) {
        let res = await this.resolve(id, importer, {
          skipSelf: true,
          ...options,
        });

        if (!res || res.external) return res;

        return res.id + postfix;
      }
    },

    async load(id) {
      if (!id.endsWith(postfix)) return;

      const htmlContent = await fsp.readFile(cleanUrl(id));
      const minified = await minify({
        compressor: htmlMinifier,
        content: htmlContent.toString('utf-8'),
        options: {
          ignoreCustomFragments: [ /<%[\s\S]*?%>/, /<\?[\s\S]*?\?>/, /\{\{(.*?)\}\}/],
          quoteCharacter: '"',
          removeAttributeQuotes: false
        }
      });

      return `export default \`${minified}\``;
    },
  }
}

export default function importHtml() {
  return [
    htmlImportServe(),
    htmlImportBuild()
  ]
}