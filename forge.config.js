const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, 'src', 'assets', 'icons', 'app-icon-simple-256x256.png'),
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'mover',
        setupIcon: path.join(__dirname, 'src', 'assets', 'icons', 'app-icon-simple-256x256.png'),
        iconUrl: path.join(__dirname, 'src', 'assets', 'icons', 'app-icon-simple-256x256.png'),
        shortcutName: 'Mover',
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
      },
      platforms: ['win32'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'UDZO',
      },
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
      platforms: ['linux'],
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
      platforms: ['linux'],
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'unknownco-lab',
          name: 'mover',
        },
        draft: true,
        prerelease: false,
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
