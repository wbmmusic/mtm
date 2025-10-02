import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
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
    ignore: [
      /^\/src/,
      /^\/public/,
      /^\/\.git/,
      /^\/node_modules\/(?!.*\.(node|dll|dylib|so)$)/,
      /^\/vite\.config/,
      /^\/tsconfig/,
      /\.md$/,
      /\.map$/
    ],
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
    // Windows code signing with HSM token - let signtool choose best certificate
    ...(process.platform === 'win32' && {
      windowsSign: {
        // Use /a to automatically select the best certificate
        signWithParams: ['/a']
      }
    })
  },
  rebuildConfig: {},
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts and Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'public/main.ts',
          config: 'vite.config.ts',
          target: 'main',
        },
        {
          entry: 'public/preload.ts',
          config: 'vite.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.config.ts',
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