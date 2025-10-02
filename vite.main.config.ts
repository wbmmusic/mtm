import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext']
  },
  build: {
    lib: {
      entry: 'public/main.ts',
      formats: ['cjs'],
      fileName: () => '[name].js'
    },
    rollupOptions: {
      external: [
        'electron',
        'serialport',
        'usb',
        '@serialport/bindings-cpp',
        'electron-updater',
        // All other Node.js built-ins
        ...require('module').builtinModules,
      ],
    },
  },
});