const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const { execSync } = require('child_process');

module.exports = {
  packagerConfig: {
    asar: true,
    // Icon path without extension - Electron Packager will auto-detect:
    // .icns on macOS, .ico on Windows, .png on Linux
    icon: path.join(__dirname, 'src', 'assets', 'icons', 'app-icon-simple-256x256'),
    // Exclude unnecessary files from packaging
    // Note: Electron Packager automatically includes production dependencies from package.json
    // We cannot ignore node_modules entirely as the main process requires runtime dependencies
    // like electron-squirrel-startup, electron-is-dev, update-electron-app, and @nut-tree/nut-js
    ignore: [
      /^\/src/,
      /^\/electron\/(index|preload)\.ts$/,
      /^\/\.git/,
      /^\/\.vscode/,
      /^\/\.idea/,
      /^\/\.env/,
      /^\/forge\.config\.js$/,
      /^\/vite\.config\.ts$/,
      /^\/tsconfig\.json$/,
      /^\/package-lock\.json$/,
      /^\/README\.md$/,
      /^\/MARKETING\.md$/,
      /^\/LICENSE\.md$/,
      /^\/\.prettierignore$/,
      /^\/\.gitignore$/,
      /^\/\.eslintrc/,
      /^\/postcss\.config\.js$/,
      /^\/tailwind\.config\.js$/,
    ],
    // Code signing and notarization disabled for local development
    // To enable for production, uncomment and provide environment variables:
    // osxSign: {},
    // osxNotarize: {
    //   tool: 'notarytool',
    //   appleId: process.env.APPLE_ID,
    //   appleIdPassword: process.env.APPLE_PASSWORD,
    //   teamId: process.env.APPLE_TEAM_ID
    // }
  },
  rebuildConfig: {},
  hooks: {
    prePackage: async (forgeConfig, platform, arch) => {
      // Clean and rebuild from source to ensure we're packaging the latest code
      // This ensures the published app matches what's in the main branch
      process.stdout.write('\n🔧 [prePackage] Cleaning previous builds...\n');
      try {
        execSync('npm run clean', { 
          stdio: 'inherit', 
          cwd: __dirname,
          shell: true
        });
        process.stdout.write('✅ [prePackage] Clean completed\n');
      } catch (error) {
        // Clean might fail if directories don't exist, that's okay
        process.stdout.write('⚠️  [prePackage] Clean completed (or nothing to clean)\n');
      }
      
      process.stdout.write('🔨 [prePackage] Building application from source...\n');
      try {
        execSync('npm run build', { 
          stdio: 'inherit', 
          cwd: __dirname,
          shell: true
        });
        process.stdout.write('✅ [prePackage] Build completed successfully\n\n');
      } catch (error) {
        process.stderr.write(`❌ [prePackage] Build failed: ${error.message}\n`);
        throw error;
      }
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Mover',
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
          name: 'Mover',
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
