import { contextBridge, ipcRenderer } from 'electron';
import * as packageJson from '../package.json';
import * as msgMkr from './msgMaker';

const version = packageJson.version;

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  send: (channel: string, args?: unknown) => ipcRenderer.send(channel, args),
  receive: (channel: string, func: (...args: unknown[]) => void) => 
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
  removeListener: (channel: string) => ipcRenderer.removeAllListeners(channel),
  ver: () => version,
  msgMkr: msgMkr,
});