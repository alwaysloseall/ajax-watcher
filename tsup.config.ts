import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      vue: 'src/adapters/vue.ts',
      react: 'src/adapters/react.tsx',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    treeshake: true,
    external: ['vue', 'react', 'react/jsx-runtime'],
  },
  {
    entry: { 'ajax-watcher': 'src/index.ts' },
    format: ['iife'],
    globalName: 'AjaxWatcher',
    outExtension: () => ({ js: '.global.js' }),
    minify: true,
    sourcemap: true,
  },
]);
