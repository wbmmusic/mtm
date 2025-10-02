"use strict";
const electron = require("electron");
const version$1 = "0.0.38";
const commandIds = {
  time: 0,
  servo: 1
};
const waitTypes = {
  remote: 0
};
const makeServoPositionData = (servoNumber, position) => {
  let commandByte = commandIds.servo << 6;
  commandByte = commandByte | 0 << 4;
  commandByte = commandByte | servoNumber;
  return [commandByte, position];
};
const makeDelayData = (time) => {
  let commandByte = 0;
  let timeLowByte = time & 255;
  let timeHighByte = time >> 8 & 31;
  commandByte = commandByte | timeHighByte;
  return [commandByte, timeLowByte];
};
const makeWaitData = (type, val) => {
  let commandByte = commandIds.time << 6 | 1 << 5 | type << 4 | val & 15;
  return [commandByte];
};
const msgMkr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  makeDelayData,
  makeServoPositionData,
  makeWaitData,
  waitTypes
}, Symbol.toStringTag, { value: "Module" }));
const version = version$1;
electron.contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args),
  send: (channel, args) => electron.ipcRenderer.send(channel, args),
  receive: (channel, func) => electron.ipcRenderer.on(channel, (event, ...args) => func(...args)),
  removeListener: (channel) => electron.ipcRenderer.removeAllListeners(channel),
  ver: () => version,
  msgMkr
});
