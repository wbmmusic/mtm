import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { VitePlugin } from '@electron-forge/plugin-vite';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

const config: ForgeConfig = {
  hooks: {
    /**
     * packageAfterCopy hook - Install production dependencies directly in the app directory
     * This ensures ALL production dependencies and their transitive dependencies are available at runtime
     */
    packageAfterCopy: async (forgeConfig, buildPath, electronVersion, platform, arch) => {
      console.log('📦 [packageAfterCopy] Installing production dependencies...');
      console.log(`   Build path: ${buildPath}`);

      // Copy package.json to build path
      const pkgJsonSource = path.resolve(__dirname, 'package.json');
      const pkgJsonDest = path.join(buildPath, 'package.json');

      await fs.copy(pkgJsonSource, pkgJsonDest);

      // Run pnpm install --prod to install only production dependencies
      // This automatically handles all transitive dependencies
      console.log('   Running: pnpm install --prod --no-optional');

      try {
        execSync('pnpm install --prod --no-optional --shamefully-hoist', {
          cwd: buildPath,
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'production' }
        });
        console.log('✓ [packageAfterCopy] Production dependencies installed successfully');
      } catch (error) {
        console.error('✗ [packageAfterCopy] Failed to install dependencies:', error);
        throw error;
      }
    }
  },
  packagerConfig: {
    name: 'MTM',
    executableName: 'MTM',
    appBundleId: 'com.wbm.mtm',
    appCopyright: 'WBM Tek',
    icon: './public/icon', // no extension needed, Forge will find .ico/.icns
    extraResource: [
      './public/sounds',
      './public/images'
    ],
    // CRITICAL: Unpack native modules from ASAR so they can be loaded at runtime
    // The pattern now includes node_modules to unpack all .node binaries
    asar: {
      unpack: '**/node_modules/**/*.{node,dll,dylib,so}'
    },
    osxSign: {
      identity: 'Developer ID Application: WBM Tek'
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID || '',
      appleIdPassword: process.env.APPLE_PASSWORD || '',
      teamId: process.env.APPLE_TEAM_ID || ''
    },
    win32metadata: {
      CompanyName: 'WBM Tek',
      FileDescription: 'MTM Composer',
      ProductName: 'MTM',
      InternalName: 'MTM',
      OriginalFilename: 'MTM.exe'
    },
    // Windows code signing with EV certificate on SafeNet HSM token
    // Using SHA1 thumbprint from .env to select the specific certificate
    ...(process.env.WINDOWS_SIGN_THUMBPRINT && {
      windowsSign: {
        signWithParams: `/sha1 ${process.env.WINDOWS_SIGN_THUMBPRINT}`
      }
    })
  },
  rebuildConfig: {
    // Ensure native modules are rebuilt for the target platform
    force: true,
  },
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts and Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'public/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'public/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
  makers: [
    new MakerSquirrel({
      name: 'MTM',
      setupExe: 'MTM-Setup.exe',
      setupIcon: './public/icon.ico'
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDeb({
      options: {
        name: 'mtm',
        productName: 'MTM',
        genericName: 'MTM Composer',
        description: 'MTM Composer',
        categories: ['Education'],
        maintainer: 'WBM Tek',
        homepage: 'https://www.wbmtek.com'
      }
    }),
    new MakerRpm({
      options: {
        name: 'mtm',
        productName: 'MTM',
        genericName: 'MTM Composer',
        description: 'MTM Composer',
        categories: ['Education']
      }
    })
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'wbmmusic',
        name: 'mtm'
      },
      prerelease: false,
      draft: true
    })
  ]
};

export default config;