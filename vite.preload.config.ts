import { defineConfig } from 'vite';
import { builtinModules } from 'module';

// https://vitejs.dev/config
export default defineConfig({
  // NOTE: We do NOT define 'build.lib' here.
  // The @electron-forge/plugin-vite will configure it automatically
  // based on the 'entry' in forge.config.ts.

  build: {
    rollupOptions: {
      // Mark all Node.js built-ins as external
      external: [
        'electron',
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