# Electron Forge + Vite: Native Modules Not Loading in Packaged App

## Problem Summary

I'm building an Electron application using **Electron Forge 7.10.2** with the **@electron-forge/plugin-vite** and I'm encountering a critical issue where native Node.js modules (`serialport`, `usb`, `electron-updater`) are not being included in the packaged application, causing the app to crash at runtime with "Cannot find module" errors.

## Environment

- **Electron Forge**: 7.10.2
- **Vite**: 5.4.11
- **Node.js**: Latest LTS
- **Platform**: Windows (but needs to work cross-platform)
- **Package Manager**: pnpm

## Native Dependencies (in production dependencies)

```json
{
  "dependencies": {
    "electron-updater": "^6.6.2",
    "serialport": "^13.0.0",
    "usb": "^2.16.0"
  }
}
```

## Error at Runtime

When running the packaged executable (`./out/MTM-win32-x64/MTM.exe`), the app immediately crashes with:

```
Uncaught Exception:
Error: Cannot find module 'electron-updater'
Require stack:
- C:\Users\wbmmu\Desktop\electron\MTM\mtm-app\out\MTM-win32-x64\resources\...\main.js
```

## Current Configuration

### forge.config.ts

```typescript
import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { VitePlugin } from "@electron-forge/plugin-vite";

const config: ForgeConfig = {
  packagerConfig: {
    name: "MTM",
    executableName: "MTM",
    appBundleId: "com.wbm.mtm",
    icon: "./public/icon",
    extraResource: ["./public/sounds", "./public/images"],
    // CRITICAL: Unpack native modules from ASAR so they can be loaded at runtime
    asar: {
      unpack:
        "**/{serialport,usb,@serialport,@electron,bindings,file-uri-to-path,node-addon-api,node-gyp-build,prebuild-install,detect-libc}/**/*.{node,dll,dylib,so}",
    },
  },
  rebuildConfig: {
    force: true,
  },
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "public/main.ts",
          config: "vite.main.config.ts",
        },
        {
          entry: "public/preload.ts",
          config: "vite.preload.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
  ],
  makers: [
    new MakerSquirrel({
      name: "MTM",
      setupExe: "MTM-Setup.exe",
      setupIcon: "./public/icon.ico",
    }),
  ],
};

export default config;
```

### vite.main.config.ts

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    conditions: ["node"],
    mainFields: ["module", "jsnext:main", "jsnext"],
  },
  build: {
    lib: {
      entry: "public/main.ts",
      formats: ["cjs"],
      fileName: () => "[name].js",
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        "electron",
        // Native modules must be external - they'll be loaded from node_modules at runtime
        "serialport",
        "usb",
        "@serialport/bindings-cpp",
        "@serialport/parser-readline",
        "@serialport/stream",
        "bindings",
        "electron-updater",
        // All other Node.js built-ins
        ...require("module").builtinModules,
        ...require("module").builtinModules.map((m: string) => `node:${m}`),
      ],
      output: {
        format: "cjs",
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        interop: "auto",
        paths: {
          serialport: "serialport",
          usb: "usb",
          "@serialport/bindings-cpp": "@serialport/bindings-cpp",
          "electron-updater": "electron-updater",
        },
      },
    },
  },
});
```

## Observations

1. **Packaging succeeds without errors** - `pnpm run package` completes successfully
2. **No app.asar.unpacked folder is created** - After packaging, `out/MTM-win32-x64/resources/` contains only:
   - `app.asar` (the packed application)
   - `images/` folder (from extraResource)
   - `sounds/` folder (from extraResource)
   - **BUT NO `app.asar.unpacked/` folder** where native modules should be
3. **Development mode works perfectly** - `pnpm run start` runs without issues, all native modules load correctly
4. **Native modules are marked as external in Vite** - They're not bundled by Vite
5. **The modules ARE in production dependencies** - They're not dev dependencies

## What I've Tried

1. ✅ Disabled code signing (was causing initial packaging failures)
2. ✅ Added ASAR unpack patterns in `forge.config.ts`
3. ✅ Marked native modules as external in Vite config
4. ✅ Verified modules are in production dependencies
5. ✅ Set `rebuildConfig.force: true`
6. ❌ Still no `app.asar.unpacked` folder created
7. ❌ Modules not found at runtime

## The Core Issue

When using Electron Forge with the Vite plugin:

1. **Vite externalizes the native modules** (doesn't bundle them)
2. **Electron Forge packages the app** (creates app.asar)
3. **Native modules are NOT being included** in the package at all
4. **ASAR unpacking never happens** because the modules aren't in the ASAR to begin with

## Questions for AI Assistants

1. **How do I ensure externalized Vite modules get copied into the Electron Forge package?**
2. **What's the correct configuration for Electron Forge + Vite + Native Modules?**
3. **Should I be using a different approach entirely** (e.g., electron-builder, different Vite config, custom packaging hooks)?
4. **Is there a way to force Electron Forge to include node_modules** for specific packages?
5. **Are there any documented patterns** for this specific toolchain combination?

## Expected Behavior

After packaging, I should have:

```
out/MTM-win32-x64/resources/
├── app.asar                    ✅ (exists)
├── app.asar.unpacked/          ❌ (missing!)
│   └── node_modules/
│       ├── serialport/
│       ├── usb/
│       ├── @serialport/
│       ├── electron-updater/
│       └── bindings/
├── images/                     ✅ (exists)
└── sounds/                     ✅ (exists)
```

And the native modules should load successfully from `app.asar.unpacked/node_modules/` at runtime.

## Additional Context

- The application works perfectly in development mode (`electron-forge start`)
- The issue only occurs with the packaged executable
- This is a critical blocker for production deployment
- The app needs cross-platform support (Windows, macOS, Linux)

## Request for Help

Please provide a working configuration or approach that will:

1. Include native Node.js modules in the packaged Electron app
2. Properly unpack them from ASAR for runtime loading
3. Work with the Electron Forge + Vite toolchain
4. Support cross-platform packaging

Any insights, alternative approaches, or working examples would be greatly appreciated!
