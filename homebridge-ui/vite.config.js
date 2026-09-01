import path from 'path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';

function homebridgeIndexHtml() {
  return {
    name: 'homebridge-index-html',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'asset' && chunk.fileName === 'index.html' && typeof chunk.source === 'string') {
          chunk.source = chunk.source
            .replace(/<!DOCTYPE html>/i, '')
            .replace(/<html[^>]*>/i, '')
            .replace(/<\/html>/i, '')
            .replace(/<head[^>]*>/i, '')
            .replace(/<\/head>/i, '')
            .replace(/<body[^>]*>/i, '')
            .replace(/<\/body>/i, '')
            .trim();
        }
      }
    },
  };
}

export default defineConfig({
  base: './',
  root: import.meta.dirname,
  plugins: [vue(), svgLoader({ defaultImport: 'component' }), homebridgeIndexHtml()],
  publicDir: false,
  build: {
    outDir: path.resolve(import.meta.dirname, 'public'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, 'index.html'),
    },
  },
});
