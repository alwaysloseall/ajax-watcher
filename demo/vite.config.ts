import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      'ajax-watcher': resolve(__dirname, '../src/index.ts'),
    },
  },
});
