import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: 'public/main.ts',
        onstart(options) {
          if (process.env.VSCODE_DEBUG) {
            console.log(/* For `.vscode/.debug.json` */'[startup] Electron App')
          } else {
            options.startup()
          }
        },
        vite: {
          build: {
            sourcemap: false,
            minify: process.env.NODE_ENV === 'production',
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                'serialport',
                'usb',
                '@serialport/bindings-cpp',
                'electron-updater',
                // All other Node.js built-ins and Electron dependencies
                ...Object.keys(require('./package.json').dependencies || {}),
              ],
            },
          },
        },
      },
      {
        entry: 'public/preload.ts',
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
          // instead of restarting the entire Electron App.
          options.reload()
        },
        vite: {
          build: {
            sourcemap: 'inline',
            minify: process.env.NODE_ENV === 'production',
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                'serialport',
                'usb',
                '@serialport/bindings-cpp',
                'electron-updater',
                // All other Node.js built-ins and Electron dependencies
                ...Object.keys(require('./package.json').dependencies || {}),
              ],
            },
          },
        },
      }
    ]),
  ],
  server: process.env.VSCODE_DEBUG ? (() => {
    const url = new URL('http://localhost:5173')
    return {
      host: url.hostname,
      port: +url.port,
    }
  })() : undefined,
  clearScreen: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})