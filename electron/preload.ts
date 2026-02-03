import { ipcRenderer, contextBridge } from 'electron';

/**
 * Using the ipcRenderer directly in the browser through the contextBridge ist not really secure.
 * I advise using the Main/api way !!
 */
contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);

// eslint-disable-next-line no-undef
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

// License API
const licenseApi = {
  checkLicense: () => ipcRenderer.invoke('license:check'),
  activateLicense: (licenseKey: string) => ipcRenderer.invoke('license:activate', licenseKey),
  deactivateLicense: () => ipcRenderer.invoke('license:deactivate'),
  getLicenseInfo: () => ipcRenderer.invoke('license:getInfo'),
  validateOnline: () => ipcRenderer.invoke('license:validateOnline'),
  formatLicenseKey: (licenseKey?: string) => ipcRenderer.invoke('license:format', licenseKey),
};

// TypeScript types for renderer process
export interface LicenseAPI {
  checkLicense: () => Promise<{
    isLicensed: boolean;
    payload?: {
      email: string;
      licenseId: string;
      issuedAt: number;
      expiresAt: number | null;
      product: string;
      version: string;
    };
    needsValidation?: boolean;
  }>;
  activateLicense: (licenseKey: string) => Promise<{
    valid: boolean;
    payload?: any;
    error?: string;
  }>;
  deactivateLicense: () => Promise<{ success: boolean }>;
  getLicenseInfo: () => Promise<any>;
  validateOnline: () => Promise<{ valid: boolean; error?: string }>;
  formatLicenseKey: (licenseKey?: string) => Promise<string>;
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }

    return null;
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (parent && Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }

    return null;
  }
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const styleContent = `
  .app-loading-wrap {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #282c34;
    z-index: 9;
  }

  .loading-icon {
    width: 120px;
    height: 120px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }
  `;

  const htmlContent = `
    <img class="loading-icon" src="/assets/icons/app-icon.svg" alt="Loading" />
  `;

  const oStyle = document.createElement('style');
  const oDiv = document.createElement('div');

  oStyle.id = 'app-loading-style';
  oStyle.innerHTML = styleContent;
  oDiv.id = 'loading-to-remove';
  oDiv.className = 'app-loading-wrap';
  oDiv.innerHTML = htmlContent;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    }
  };
}

const { appendLoading, removeLoading } = useLoading();

domReady().then(appendLoading);

declare global {
  interface Window {
    Main: typeof api;
    ipcRenderer: typeof ipcRenderer;
    license: LicenseAPI;
  }
}

const api = {
  /**
   * Here you can expose functions to the renderer process
   * so they can interact with the main (electron) side
   * without security problems.
   *
   * The function below can accessed using `window.Main.sayHello`
   */
  sendMessage: (message: string) => {
    ipcRenderer.send('message', message);
  },
  /**
    Here function for AppBar
   */
  Minimize: () => {
    ipcRenderer.send('minimize');
  },
  Maximize: () => {
    ipcRenderer.send('maximize');
  },
  Close: () => {
    ipcRenderer.send('close');
  },
  removeLoading: () => {
    removeLoading();
  },
  /**
   * Provide an easier way to listen to events
   */
  on: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
  /**
   * Mouse control functions
   */
  moveMouse: async (direction: 'left' | 'right' | 'up' | 'down', pixels: number) => {
    return ipcRenderer.invoke('mouse:move', direction, pixels);
  },
  /**
   * Cancel current mouse operation
   */
  cancelMouseOperation: () => {
    ipcRenderer.send('mouse:cancel');
  }
};

contextBridge.exposeInMainWorld('Main', api);
// Expose to renderer process
contextBridge.exposeInMainWorld('license', licenseApi);