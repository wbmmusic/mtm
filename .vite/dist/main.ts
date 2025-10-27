import { app, BrowserWindow, ipcMain, protocol, screen } from 'electron';
import { BrowserWindow as BrowserWindowType } from 'electron';
import { join } from 'node:path';
import * as url from 'node:url';
import { autoUpdater } from 'electron-updater';
import { initUSB } from './usb';
import { checkFolders } from './utils.js';
import { checkForFirmwareUpdates, compareToLatest } from './firmware';
import './ipc';

// Vite defines these constants for Electron Forge
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let firstReactInit: boolean = true;
let win: BrowserWindowType | null = null; // The App Window

// Export getter function for win
export const getWin = (): BrowserWindowType | null => win;

checkFolders();

////////  SINGLE INSTANCE //////////
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) app.quit();

app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
//////  END SINGLE INSTANCE ////////

function createWindow(): void {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 625,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: join(__dirname, '/favicon.ico'),
    title: "MTM --- v" + app.getVersion()
  });

  // Load the app using Vite constants
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win!.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // In production, Vite outputs to .vite/dist/index.html
    // main.js is in .vite/build, so we go up one level then into dist
    win!.loadFile(join(__dirname, '../dist/index.html'));
  }

  win!.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load page:', errorCode, errorDescription, validatedURL);
  });

  // Emitted when the window is closed.
  win!.on('closed', () => win = null);

  win!.on('ready-to-show', () => {
    win?.show();
    // Send initial scale factor
    const display = screen.getDisplayMatching(win!.getBounds());
    win?.webContents.send('display-changed', { scaleFactor: display.scaleFactor });
  });

  // Monitor display changes
  win!.on('moved', () => {
    const display = screen.getDisplayMatching(win!.getBounds());
    win?.webContents.send('display-changed', { scaleFactor: display.scaleFactor });
  });
}

// Create myWindow, load the rest of the app, etc...
app.on('ready', () => {
  //log("-APP IS READY");

  // Register custom protocols for sounds and images
  // In dev: __dirname is .vite/build, need to go up to project root then into public
  // In prod: __dirname is .vite/build, resources are in .vite/dist
  protocol.registerFileProtocol('sound', (request, callback) => {
    const urlPath = request.url.substr(7);
    console.log("SOUND URL ->", urlPath);
    const soundPath = app.isPackaged
      ? join(__dirname, '../dist/sounds', urlPath)
      : join(__dirname, '../../public/sounds', urlPath);
    console.log("SOUND PATH ->", soundPath);
    callback({ path: soundPath });
  });

  protocol.registerFileProtocol('img', (request, callback) => {
    const urlPath = request.url.substr(5);
    console.log("IMAGE URL ->", urlPath);
    const imgPath = app.isPackaged
      ? join(__dirname, '../dist/images', urlPath)
      : join(__dirname, '../../public/images', urlPath);
    console.log("IMAGE PATH ->", imgPath);
    callback({ path: imgPath });
  });

  ipcMain.on('reactIsReady', () => {
    win?.webContents.send('app_version', app.getVersion());
    if (firstReactInit === true) {
      firstReactInit = false;
      console.log('React Is Ready');
      compareToLatest();

      // Auto-updater only works when installed via installer (not when run from out/ folder)
      // Check if we're in a properly installed location by looking for update infrastructure
      const isInstalled = app.isPackaged && !process.execPath.includes('\\out\\');

      if (isInstalled) {
        win?.webContents.send('message', 'App is packaged and installed');

        autoUpdater.on('error', (err) => {
          console.log('Auto-updater error:', err);
          win?.webContents.send('updater', 'error', err);
        });
        autoUpdater.on('checking-for-update', () => win?.webContents.send('updater', "checking-for-update"));
        autoUpdater.on('update-available', (info) => win?.webContents.send('updater', 'update-available', info));
        autoUpdater.on('update-not-available', (info) => win?.webContents.send('updater', 'update-not-available', info));
        autoUpdater.on('download-progress', (info) => win?.webContents.send('updater', 'download-progress', info));
        autoUpdater.on('update-downloaded', (info) => win?.webContents.send('updater', 'update-downloaded', info));
        ipcMain.on('installUpdate', () => {
          win?.webContents.send('updater', 'relaunching');
          autoUpdater.quitAndInstall();
        });

        setTimeout(() => autoUpdater.checkForUpdates(), 3000);
        setInterval(() => autoUpdater.checkForUpdates(), 1000 * 60 * 60);
      } else if (app.isPackaged) {
        console.log('Running packaged app from out/ folder - auto-updater disabled');
      }
    }
  });

  initUSB();

  createWindow();

  checkForFirmwareUpdates();

  // setInterval(() => {
  //     console.log(connectedDeviceInfo)
  // }, 1000);
});
///////////////////////

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
  if (win === null) createWindow();
});

////////////////// END App Startup ///////////////////////////////////////////////////////////////