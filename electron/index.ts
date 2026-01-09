// Native
import { join } from 'path';

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, nativeTheme } from 'electron';
import isDev from 'electron-is-dev';
import { mouse, left, right, up, down } from '@nut-tree/nut-js';
const updateElectronApp = require('update-electron-app');

const height = 600;
const width = 800;

function createWindow() {
  // Create the browser window.
  const window = new BrowserWindow({
    width,
    height,
    //  change to false to use AppBar
    frame: false,
    show: true,
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      // Enable remote debugging in development
      ...(isDev && {
        webSecurity: false,
        nodeIntegration: false,
        contextIsolation: true
      })
    }
  });

  const port = process.env.PORT || 3000;
  const url = isDev ? `http://localhost:${port}` : join(__dirname, '../dist-vite/index.html');

  // and load the index.html of the app.
  if (isDev) {
    window?.loadURL(url);
    // Open the DevTools automatically only if --devtools flag is present
    if (process.argv.includes('--devtools')) {
      window?.webContents.openDevTools();
    }
  } else {
    window?.loadFile(url);
  }

  // Enable keyboard shortcuts for DevTools in development
  if (isDev) {
    window.webContents.on('before-input-event', (_event, input) => {
      // F12 or Ctrl+Shift+I to toggle DevTools
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        if (window.webContents.isDevToolsOpened()) {
          window.webContents.closeDevTools();
        } else {
          window.webContents.openDevTools();
        }
      }
    });
  }

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

// Configure auto-updater (only in production)
if (!isDev) {
  updateElectronApp();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

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

// Mouse control handlers
ipcMain.handle('mouse:move', async (_event, direction: 'left' | 'right' | 'up' | 'down', pixels: number) => {
  if (currentOperationCancelled) {
    currentOperationCancelled = false;
    return { success: false, error: 'Cancelled' };
  }

  try {
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
    return { success: false, error: String(error) };
  }
});

// Cancel handler to interrupt current operations
ipcMain.on('mouse:cancel', () => {
  currentOperationCancelled = true;
});
