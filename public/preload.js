const { contextBridge, ipcRenderer } = require('electron')
const version = require('../package.json').version
const msgMkr = require('./msgMaker')

contextBridge.exposeInMainWorld('electron', {
    invoke: (a, b, c) => ipcRenderer.invoke(a, b, c),
    send: (channel, args) => ipcRenderer.send(channel, args),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    removeListener: (channel) => ipcRenderer.removeAllListeners(channel),
    ver: () => version,
    msgMkr: msgMkr,
})