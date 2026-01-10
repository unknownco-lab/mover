const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const { execSync } = require('child_process');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, 'src', 'assets', 'icons', 'app-icon-simple-256x256.ico'),
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID
    }
  },
  rebuildConfig: {},
  hooks: {
    prePackage: async () => {
      // Clean and rebuild from source to ensure we're packaging the latest code
      console.log('Cleaning previous builds...');
      try {
        execSync('npm run clean', { stdio: 'inherit', cwd: __dirname });
      } catch (error) {
        // Clean might fail if directories don't exist, that's okay
        console.log('Clean completed (or nothing to clean)');
      }
      
      console.log('Building application from source...');
      try {
        execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
        console.log('Build completed successfully');
      } catch (error) {
        console.error('Build failed:', error);
        throw error;
      }
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'mover',
        setupIcon: path.join(__dirname, 'src', 'assets', 'icons', 'app-icon-simple-256x256.ico'),
        // iconUrl must be an HTTPS URL (optional - used for Control Panel display)
        // For now, we'll rely on setupIcon which is used for shortcuts
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
