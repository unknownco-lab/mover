// Handle Squirrel.Windows events (must be at the very top, before any other imports)
// This handles installation, update, and shortcut creation events
if (require('electron-squirrel-startup')) {
  // App was started by Squirrel installer/updater, exit immediately
  process.exit(0);
}

// Native
import { join } from 'path';
import { existsSync } from 'fs';

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, nativeTheme, session, systemPreferences } from 'electron';
import { LicenseManager } from './license/manager';
import isDev from 'electron-is-dev';
// Lazy import nut-js to avoid permission checks on startup
let nutJsModule: any = null;

const height = 800;
const width = 800;

function getIconPath() {
  // Determine icon extension based on platform
  const iconExt = process.platform === 'darwin' ? 'icns' : process.platform === 'win32' ? 'ico' : 'png';
  const iconName = `app-icon.${iconExt}`;

  if (isDev) {
    return join(__dirname, '..', 'src', 'assets', 'icons', iconName);
  }
  // In production, icon is packaged with the app
  const possibleIconPaths = [
    join(__dirname, `../assets/icons/${iconName}`),
    join(app.getAppPath(), `assets/icons/${iconName}`),
    join(process.resourcesPath, `app/assets/icons/${iconName}`)
  ];
  return possibleIconPaths.find((p) => existsSync(p)) || possibleIconPaths[0];
}

function createWindow() {
  // Create the browser window.
  const window = new BrowserWindow({
    width,
    height,
    icon: getIconPath(),
    //  change to false to use AppBar
    frame: false,
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Keep webSecurity enabled for security (in both dev and production)
      // Only disable if you encounter CORS issues with localhost during development
      webSecurity: true
    }
  });

  const port = process.env.PORT || 3000;
  let url: string;

  if (isDev) {
    url = `http://localhost:${port}`;
  } else {
    // In production, try multiple possible paths
    // Electron Forge packages files in resources/app.asar or resources/app.asar.unpacked
    const possiblePaths = [
      join(__dirname, '../dist-vite/index.html'),
      join(app.getAppPath(), 'dist-vite/index.html'),
      join(process.resourcesPath, 'app/dist-vite/index.html')
    ];

    // Try to find the correct path
    url = possiblePaths.find((path) => existsSync(path)) || possiblePaths[0];

    console.log('Production paths checked:', possiblePaths);
    console.log('Using path:', url);
  }

  // Load the index.html of the app with error handling
  const loadWindow = async () => {
    try {
      if (isDev) {
        await window?.loadURL(url);
        // Open the DevTools automatically only if --devtools flag is present
        if (process.argv.includes('--devtools')) {
          window?.webContents.openDevTools();
        }
      } else {
        await window?.loadFile(url);
      }

      // Enable DevTools in production if --devtools flag is present (for debugging)
      if (!isDev && process.argv.includes('--devtools')) {
        window?.webContents.openDevTools();
      }
    } catch (error) {
      console.error('Failed to load window:', error);
      // Only open DevTools in development mode or if explicitly requested
      if (isDev && window && !window.webContents.isDevToolsOpened()) {
        window.webContents.openDevTools();
      }
    }
  };

  loadWindow();

  // Add error handlers for renderer process
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', {
      errorCode,
      errorDescription,
      validatedURL
    });
    // Only open DevTools in development mode or if explicitly requested
    if (isDev && !window.webContents.isDevToolsOpened()) {
      window.webContents.openDevTools();
    }
  });

  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('Render process crashed:', details);
  });

  // Enable keyboard shortcuts for DevTools (works in dev and production with --devtools flag)
  window.webContents.on('before-input-event', (_event, input) => {
    // F12 or Ctrl+Shift+I to toggle DevTools (always allow in dev, or if --devtools flag is present)
    if (isDev || process.argv.includes('--devtools')) {
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        if (window.webContents.isDevToolsOpened()) {
          window.webContents.closeDevTools();
        } else {
          window.webContents.openDevTools();
        }
      }
    }
  });

  // For AppBar
  ipcMain.on('minimize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMinimized() ? window.restore() : window.minimize();
    // or alternatively: win.isVisible() ? win.hide() : win.show()
  });
  ipcMain.on('maximize', () => {
    // eslint-disable-next-line no-unused-expressions
    window.isMaximized() ? window.restore() : window.maximize();
  });

  ipcMain.on('close', () => {
    window.close();
  });

  nativeTheme.themeSource = 'dark';
}

// Auto-updater is now initialized in app.whenReady() with a delay
// to prevent restart loops during app startup

// Configure Content Security Policy
function configureCSP() {
  const defaultSession = session.defaultSession;

  // Set CSP headers - stricter in production, more permissive in dev for Vite HMR
  // Note: In dev, we allow unsafe-eval for Vite HMR, but this is only in development
  const csp = isDev
    ? // Development: Allow Vite HMR and dev server connections
      // unsafe-eval is needed for Vite's HMR in dev mode
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*; img-src 'self' data: https:;"
    : // Production: Strict CSP without unsafe-eval
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self'; img-src 'self' data:;";

  defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  configureCSP();
  createWindow();

  // Delay auto-update check to prevent restart loop during app startup
  // Wait 10 seconds after app is ready before checking for updates
  if (!isDev) {
    setTimeout(() => {
      try {
        const updateElectronApp = require('update-electron-app');
        const updater = typeof updateElectronApp === 'function' ? updateElectronApp : updateElectronApp?.default;

        if (updater) {
          updater({
            repo: 'unknownco-lab/mover',
            updateInterval: '5 minutes',
            notifyUser: true,
            autoDownload: false
          });
        }
      } catch (error) {
        console.error('Failed to initialize auto-updater:', error);
      }
    }, 10000); // 10 second delay
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send('message', 'common.hiElectron'), 500);
});

// Track cancellation state
let currentOperationCancelled = false;
let permissionRequestShown = false;

// Lazy load nut-js module only when needed
async function getNutJs() {
  if (!nutJsModule) {
    try {
      nutJsModule = await import('@nut-tree/nut-js');
    } catch (error) {
      console.error('Failed to load nut-js:', error);
      throw new Error('Failed to initialize mouse control library');
    }
  }
  return nutJsModule;
}

// Mouse control handlers
ipcMain.handle('mouse:move', async (_event, direction: 'left' | 'right' | 'up' | 'down', pixels: number) => {
  if (currentOperationCancelled) {
    currentOperationCancelled = false;
    return { success: false, error: 'Cancelled' };
  }

  // On macOS, check permissions first to avoid repeated System Preferences prompts
  if (process.platform === 'darwin' && !permissionRequestShown) {
    try {
      // Check if accessibility permissions are granted (this doesn't prompt)
      const hasPermission = systemPreferences.isTrustedAccessibilityClient(false);
      if (!hasPermission && !permissionRequestShown) {
        permissionRequestShown = true;
        return {
          success: false,
          error:
            'Accessibility permissions not granted. Please enable in System Settings > Privacy & Security > Accessibility, then try again.'
        };
      }
    } catch (error) {
      // If check fails, allow nut-js to handle it, but only once
      if (!permissionRequestShown) {
        permissionRequestShown = true;
      }
    }
  }

  try {
    const nutJs = await getNutJs();
    const { mouse, left, right, up, down } = nutJs;

    switch (direction) {
      case 'left':
        await mouse.move(left(pixels));
        break;
      case 'right':
        await mouse.move(right(pixels));
        break;
      case 'up':
        await mouse.move(up(pixels));
        break;
      case 'down':
        await mouse.move(down(pixels));
        break;
    }
    return { success: true };
  } catch (error) {
    console.error('Mouse movement error:', error);
    const errorMessage = String(error);

    // Check if it's a permission error
    if (errorMessage.includes('accessibility') || errorMessage.includes('permission')) {
      // Mark that we've encountered a permission error to prevent loops
      if (process.platform === 'darwin') {
        permissionRequestShown = true;
      }
      return {
        success: false,
        error:
          'Accessibility permissions required. Please enable in System Settings > Privacy & Security > Accessibility, then restart the app.'
      };
    }
    return { success: false, error: errorMessage };
  }
});

// Cancel handler to interrupt current operations
ipcMain.on('mouse:cancel', () => {
  currentOperationCancelled = true;
});

/**
 * IPC Handlers for License Operations
 */

// Check if app is licensed
ipcMain.handle('license:check', () => {
  return LicenseManager.checkLicense();
});

// Activate a new license
ipcMain.handle('license:activate', (_, licenseKey: string) => {
  return LicenseManager.activateLicense(licenseKey);
});

// Deactivate current license
ipcMain.handle('license:deactivate', () => {
  LicenseManager.deactivateLicense();
  return { success: true };
});

// Get license info
ipcMain.handle('license:getInfo', () => {
  return LicenseManager.getLicenseInfo();
});

// Validate license online (this one is still async)
ipcMain.handle('license:validateOnline', async () => {
  return await LicenseManager.validateOnline();
});

// Format license key for display
ipcMain.handle('license:format', (_, licenseKey?: string) => {
  return LicenseManager.formatLicenseKey(licenseKey);
});

console.log('License IPC handlers registered');
