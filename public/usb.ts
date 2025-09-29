import { dialog } from 'electron';
import { SerialPort } from 'serialport';
import { usb } from 'usb';
import { join } from 'node:path';
import { compareToLatest } from './firmware';
import { pathToFirmwareFolder } from './utils.js';
import { existsSync, readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { getWin } from './main.js';

process.setMaxListeners(1000000000);

const bootEmitter = new EventEmitter();

interface UsbTarget {
  vid: number;
  pid: number;
}

import type { ConnectedDeviceInfo } from './types';

interface Bootloader {
  waiting: boolean;
  serialNumber: string;
}

const usbTarget: UsbTarget[] = [
  { vid: 0x2341, pid: 0x0043 },
  { vid: 0x03EB, pid: 0x2404 }
];

const defaultBootloader: Bootloader = { waiting: false, serialNumber: '' };

let bootloader: Bootloader = { ...defaultBootloader };

global.connectedDeviceInfo = null;
let port: SerialPort | null = null; // The serialport for the connected device

const getPorts = async (): Promise<any[]> => {
  try {
    let tempPorts = await SerialPort.list();
    return tempPorts.filter(prt => !prt.path.includes('BLTH') && !prt.path.includes('Bluetooth'));
  } catch (error) {
    throw error;
  }
};

const streamMsg = Buffer.from('WBM:STREAM');
const sendStream = (data: number[]): void => {
  if (!port) return;
  const dataBuf = Buffer.from(data);
  const out = Buffer.concat([streamMsg, dataBuf]);
  port.write(out, (err) => { if (err) console.log(err); });
};

const usbStatus = (): boolean => {
  const win = getWin();
  if (port && win) {
    win.webContents.send('usb_status', true);
    return true;
  } else {
    win?.webContents.send('usb_status', false);
    return false;
  }
};

const getConnectedDeviceInfo = async (serialNumber: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!port) {
      reject(new Error('No port available'));
      return;
    }

    const exit = (err?: Error) => {
      clearTimeout(timeout);
      port?.removeListener('data', handleData);
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    };

    const handleData = (data: Buffer) => {
      const pairs = data.toString().split(";");
      const out: ConnectedDeviceInfo = { serialNumber };
      pairs.forEach(pair => {
        const keyVal = pair.split(':');
        out[keyVal[0]] = keyVal[1];
      });
      global.connectedDeviceInfo = out;
      exit();
    };

    let timeout = setTimeout(() => {
      exit(new Error("Timed Out Waiting For Device Info"));
    }, 1000);

    port.on('data', handleData);
    port.write('WBM:GETINFO');
  });
};

const openPort = async (): Promise<boolean> => {
  const win = getWin();
  try {
    let tempPorts = await getPorts();
    let thePorts = tempPorts.filter(prt => {
      for (let i = 0; i < usbTarget.length; i++) {
        if (Number("0x" + prt.vendorId) === usbTarget[i].vid && Number("0x" + prt.productId) === usbTarget[i].pid) return true;
      }
      return false;
    });

    if (thePorts.length > 0) {
      if (thePorts.length > 1) {
        console.log("MORE THAN ONE DEVICE CONNECTED");
      }
      console.log('Found device', thePorts[0].friendlyName);
      port = new SerialPort({ path: thePorts[0].path, baudRate: 9600 });
      
      return new Promise((resolve, reject) => {
        port!.on('open', async () => {
          if (thePorts[0].serialNumber.includes("BOOT:")) {
            global.connectedDeviceInfo = {
              serialNumber: thePorts[0].serialNumber,
              model: "mtm2s"
            };
            bootEmitter.emit('bootloaderDeviceConnected', thePorts[0].serialNumber);
            resolve(true);
          } else {
            win?.webContents.send('usb_status', true);
            await getConnectedDeviceInfo(thePorts[0].serialNumber);
            compareToLatest();
            resolve(true);
          }
        });

        port!.on('close', () => {
          port = null;
          console.log("Port Closed");
          global.connectedDeviceInfo = null;
          win?.webContents.send('usb_status', false);
        });

        port!.on('error', (err) => {
          port = null;
          global.connectedDeviceInfo = null;
          console.error("PORT ERROR", err);
          reject(err);
        });
      });
    } else {
      throw new Error("Didn't Find target Device");
    }
  } catch (error) {
    throw error;
  }
};

const tryToOpenPort = async (): Promise<void> => {
  try {
    await openPort();
  } catch (error) {
    console.log("Error on 1st attempt to connect", error);
    setTimeout(async () => {
      try {
        await openPort();
      } catch (error) {
        console.log("Error on 2nd attempt to connect", error);
      }
    }, 1000);
  }
};

const sendProgramCommand = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!port) {
      reject(new Error('No port available'));
      return;
    }

    const exit = (err?: Error) => {
      clearTimeout(timer);
      port?.removeListener('data', handleData);
      if (err) reject(err);
      else resolve();
    };

    const handleData = (data: Buffer) => {
      if (data.toString().includes('WBM:READY')) {
        exit();
      } else {
        exit(new Error("Didn't get expected response in sendProgramCommand"));
      }
    };

    const timer = setTimeout(() => exit(new Error('sendProgramCommand timed out')), 1000);
    port.on('data', handleData);
    port.write('WBM:LOAD');
  });
};

const sendHalfPage = async (pageHalf: number[], half: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!port) {
      reject(new Error('No port available'));
      return;
    }

    const exit = (err?: Error) => {
      clearTimeout(timer);
      port?.removeListener('data', handleData);
      if (err) reject(err);
      else resolve();
    };

    const handleData = (data: Buffer) => {
      if (JSON.stringify([...data]) === JSON.stringify(pageHalf)) {
        exit();
      } else {
        exit(new Error('Page Mismatch in sendPage'));
      }
    };

    let timer = setTimeout(() => exit(new Error('sendPage timed out')), 1000);
    port.on('data', handleData);
    
    if (half === 0) {
      const msg = Buffer.from("WBM:PAGE0");
      port.write(Buffer.concat([msg, Buffer.from(pageHalf)]));
    } else {
      const msg = Buffer.from("WBM:PAGE1");
      port.write(Buffer.concat([msg, Buffer.from(pageHalf)]));
    }
  });
};

const sendPage = async (page: number[]): Promise<void> => {
  await sendHalfPage(page.slice(0, 32), 0);
  await sendHalfPage(page.slice(32, 64), 1);
};

const sendDone = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!port) {
      reject(new Error('No port available'));
      return;
    }

    const exit = (err?: Error) => {
      clearTimeout(timer);
      port?.removeListener('data', handleData);
      if (err) reject(err);
      else resolve();
    };

    const handleData = (data: Buffer) => {
      if (data.toString().includes('WBM:DONE')) {
        exit();
      } else {
        exit(new Error('Unexpected Response in sendDone'));
      }
    };

    const timer = setTimeout(() => exit(new Error('sendDone timed out')), 1000);
    port.on('data', handleData);
    port.write('WBM:DONE', (err) => {
      if (err) exit(err);
    });
  });
};

const sendBootToBootloader = async (): Promise<void> => {
  if (!global.connectedDeviceInfo) {
    throw new Error('No connected device info');
  }

  const serial = global.connectedDeviceInfo.serialNumber.split(':')[1];
  
  return new Promise((resolve, reject) => {
    if (!port) {
      reject(new Error('No port available'));
      return;
    }

    const exit = (err?: Error) => {
      clearTimeout(timeout);
      bootEmitter.removeListener('bootloaderDeviceConnected', handleEvent);
      port?.removeListener('data', handleData);
      if (err) {
        reject(err);
      } else {
        bootloader.waiting = true;
        bootloader.serialNumber = serial;
        resolve();
      }
    };

    const handleData = (data: Buffer) => {
      if (data.toString() === "WBM:BOOT") {
        console.log("Got This Message in boot to bootloader", data.toString());
      }
    };

    const handleEvent = (serialNumber: string) => {
      if (serialNumber.includes(serial)) {
        exit();
      } else {
        exit(new Error('Bootloader device serial is not what was expected'));
      }
    };

    const timeout = setTimeout(() => {
      exit(new Error('Timed Out sending boot to bootloader'));
    }, 3000);

    port.on('data', handleData);
    bootEmitter.on('bootloaderDeviceConnected', handleEvent);
    port.write('WBM:BOOTLOADER', () => console.log("Sent Boot To Bootloader"));
  });
};

const sendPages = async (pages: number[][]): Promise<void> => {
  const win = getWin();
  let pagesSent = 0;
  win?.webContents.send('upload_progress', { show: true, value: 0 });
  
  for (const thePage of pages) {
    await sendPage(thePage);
    console.log("Sent Page", pagesSent);
    pagesSent++;
    win?.webContents.send('upload_progress', { show: true, value: (100 * pagesSent) / pages.length });
  }
  
  console.log("Sent", pagesSent, "pages");
};

const makePages = (data: number[], pageSize: number): number[][] => {
  console.log(data.length, "bytes to be packed into pages");
  let pages: number[][] = [];
  let page: number[] = [];
  
  data.forEach(byte => {
    page.push(byte);
    if (page.length === pageSize) {
      pages.push(page);
      page = [];
    }
  });
  
  while (page.length < pageSize) page.push(0xFF);
  pages.push(page);
  
  return pages;
};

const getDeviceInfo = async (): Promise<{ pageSize: number; availableSpace: number }> => {
  return new Promise((resolve, reject) => {
    if (!port) {
      reject(new Error('No port available'));
      return;
    }

    const exit = (data?: { pageSize: number; availableSpace: number }, err?: Error) => {
      clearTimeout(timer);
      port?.removeListener('data', handleData);
      if (err) {
        reject(err);
      } else if (data) {
        resolve(data);
      }
    };

    const handleData = (data: Buffer) => {
      if (data.toString().includes('WBM:FLASHINFO')) {
        const pageSize = (data[data.length - 2] << 8) | data[data.length - 1];
        const availableSpace = (data[data.length - 6] << 24) | (data[data.length - 5] << 16) | (data[data.length - 4] << 8) | data[data.length - 3];
        exit({ pageSize, availableSpace });
      } else {
        exit(undefined, new Error(`Unexpected data in getDeviceInfo ${data.toString()}`));
      }
    };

    const timer = setTimeout(() => exit(undefined, new Error('getDeviceInfo timed out')), 1000);
    port.on('data', handleData);
    port.write('WBM:GETFLASHINFO');
  });
};

const writeMcuFlash = async (data: number[]): Promise<void> => {
  const { pageSize, availableSpace } = await getDeviceInfo();
  console.log('Got Info | Page Size =', pageSize, "| Available Space =", availableSpace);

  if (data.length > availableSpace) {
    throw new Error('Sequence will not fit in EEPROM');
  }

  let pages = makePages(data, pageSize);

  await sendProgramCommand();
  await sendPages(pages);
  await sendDone();
};

const upload = async (data: number[]): Promise<void> => {
  console.log("UPLOAD");
  await writeMcuFlash(data);
};

const handleFirmwareUpload = async (file: Buffer): Promise<void> => {
  const win = getWin();
  if (!global.connectedDeviceInfo) {
    throw new Error('No connected device info');
  }

  const fileArray = Array.from(file);

  // Connected device is not in bootloader mode TYPICAL
  if (!global.connectedDeviceInfo.serialNumber.includes('BOOT:')) {
    // Just confirm that serial number does contain WBM:
    if (global.connectedDeviceInfo.serialNumber.includes('WBM:')) {
      console.log("-------------- START UPLOAD FIRMWARE --------------");
      win?.webContents.send('upload_progress', { show: true, value: null });
      await sendBootToBootloader();
      await upload(fileArray);
      win?.webContents.send('upload_progress', { show: false, value: null });
      console.log("-------------- END UPLOAD FIRMWARE --------------");
    } else {
      throw new Error('Something is wrong with the serial number of this device');
    }
  } else {
    console.log("-------------- START UPLOAD FIRMWARE FROM BOOTLOADER --------------");
    console.log('Device is in bootloader mode, Fix this');
    win?.webContents.send('upload_progress', { show: true, value: null });
    await upload(fileArray);
    win?.webContents.send('upload_progress', { show: false, value: null });
    console.log("-------------- END UPLOAD FIRMWARE FROM BOOTLOADER --------------");
  }
};

const uploadCustomFirmware = async (): Promise<boolean> => {
  const win = getWin();
  if (!win) return false;

  console.log("Upload Custom Firmware");
  const res = await dialog.showOpenDialog(win, {
    title: 'Upload Firmware',
    filters: [{ name: 'Binary File', extensions: ['bin'] }]
  });
  
  if (res.canceled === true) return false;
  
  const pathToFile = res.filePaths[0];
  console.log(pathToFile);
  const file = readFileSync(pathToFile);

  win.webContents.send('upload_progress', { show: true, value: null });
  
  try {
    await handleFirmwareUpload(file);
  } catch (error) {
    throw error;
  }

  win.webContents.send('upload_progress', { show: false, value: null });
  return true;
};

const uploadFirmware = async (): Promise<boolean> => {
  if (!global.connectedDeviceInfo) {
    throw new Error('No connected device info');
  }

  console.log("Upload Latest Firmware");
  const pathToDeviceFolder = join(pathToFirmwareFolder, global.connectedDeviceInfo.model!.toLowerCase());
  
  if (!existsSync(pathToDeviceFolder)) {
    throw new Error("Folder Doesn't Exist");
  }
  
  const devLatest = JSON.parse(readFileSync(join(pathToDeviceFolder, 'latest.json'), 'utf8'));
  const pathToLatestFirmwareFile = join(pathToDeviceFolder, devLatest.name);
  const file = readFileSync(pathToLatestFirmwareFile);

  await handleFirmwareUpload(file);
  return true;
};

const initUSB = (): void => {
  usb.on('attach', (e) => {
    const vid = e.deviceDescriptor.idVendor;
    const pid = e.deviceDescriptor.idProduct;
    
    for (let i = 0; i < usbTarget.length; i++) {
      if (vid === usbTarget[i].vid && pid === usbTarget[i].pid) {
        console.log("Device was attached");
        if (!port) {
          tryToOpenPort();
          break;
        } else {
          console.log("Device Attached but another is already connected");
        }
      }
    }
  });

  usb.on('detach', (e) => {
    const vid = e.deviceDescriptor.idVendor;
    const pid = e.deviceDescriptor.idProduct;
    
    for (let i = 0; i < usbTarget.length; i++) {
      if (vid === usbTarget[i].vid && pid === usbTarget[i].pid) {
        console.log("Device was detached");
        if (port) {
          global.connectedDeviceInfo = null;
          port.close();
          break;
        }
      }
    }
  });

  tryToOpenPort();
};

export { initUSB, upload, uploadCustomFirmware, uploadFirmware, sendStream, usbStatus };