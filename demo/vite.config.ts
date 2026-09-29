import { defineConfig } from 'vite';
import { resolve } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  root: resolve(__dirname),
  base: isProduction ? '/ajax-watcher/' : '/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'ajax-watcher': resolve(__dirname, '../src/index.ts'),
    },
  },
});
