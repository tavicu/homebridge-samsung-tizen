import path from 'path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';

export default defineConfig({
  base: './',
  root: import.meta.dirname,
  plugins: [vue(), svgLoader({ defaultImport: 'component' })],
  publicDir: false,
  build: {
    outDir: path.resolve(import.meta.dirname, 'public'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, 'index.html'),
    },
  },
});
