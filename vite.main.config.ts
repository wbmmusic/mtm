import { defineConfig } from 'vite';
import { builtinModules } from 'module';

// https://vitejs.dev/config
export default defineConfig({
  // NOTE: We do NOT define 'build.lib' here.
  // The @electron-forge/plugin-vite will configure it automatically
  // based on the 'entry' in forge.config.ts.
  // Manually defining it breaks the plugin's logic that creates
  // node_modules in the build output.

  build: {
    // Ensure source maps for debugging
    sourcemap: true,
    rollupOptions: {
      // The 'input' is set automatically by the Vite plugin
      // based on the 'entry' in forge.config.ts.

      // Mark all Node.js built-ins and native modules as external
      external: [
        'electron',
        // Native modules must be external - they'll be loaded from node_modules at runtime
        'serialport',
        'usb',
        '@serialport/bindings-cpp',
        '@serialport/parser-readline',
        '@serialport/stream',
        'bindings',
        'electron-updater',
        // All Node.js built-ins
        ...builtinModules,
        ...builtinModules.map((m: string) => `node:${m}`),
      ],
      output: {
        // Ensure we are outputting a CJS module
        format: 'cjs',
      }
    },
  },
});