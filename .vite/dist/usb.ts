/**
 * public/usb.ts
 *
 * USB and Serial communication helpers used by the Electron main process.
 *
 * Responsibilities:
 * - Detect MTM-compatible USB devices (VID/PID)
 * - Open and manage the serial connection to the device
 * - Query device info and perform firmware uploads using the WBM: protocol
 *
 * Audience: Developers — this file contains the low-level bootloader/upload
 * protocol implementations and should be read by maintainers working on
 * firmware, USB, or packaging.
 */

// NOTE: Keep imports grouped and stable; these are Node/Electron native imports
// and third-party libs used by the main process.
import { dialog } from 'electron';
import { SerialPort } from 'serialport';
import { usb } from 'usb';
import { join } from 'node:path';
import { compareToLatest } from './firmware';
import { pathToFirmwareFolder } from './utils.js';
import { existsSync, readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import type { ConnectedDeviceInfo } from './types';
// (type imported above with other imports)
import { getWin } from './main.js';

// Increase listener limit because attach/detach and serial event listeners are
// registered repeatedly during device reconnects. The value is intentionally
// large to avoid EMITTER_LEAK warnings during rapid reconnects in dev.
// TODO: consider limiting listeners by removing unused listeners more
// aggressively or extracting a shared lifecycle manager.
process.setMaxListeners(1000000000);

/** EventEmitter used to signal when a device in bootloader mode reconnects. */
const bootEmitter = new EventEmitter();

/** USB device identity used to match supported MTM controllers. */
interface UsbTarget {
  /** Numeric vendor id (0x prefixed values are converted to Number). */
  vid: number;
  /** Numeric product id. */
  pid: number;
}

/**
 * A lightweight shape for the objects returned by SerialPort.list()
 * We only include the fields used by this module.
 */
interface PortInfo {
  path: string;
  vendorId?: string;
  productId?: string;
  serialNumber?: string;
  friendlyName?: string;
  manufacturer?: string;
}

/** Tracks the state when a device is asked to reboot into its bootloader. */
interface Bootloader {
  /** Whether we are awaiting the bootloader device to reconnect. */
  waiting: boolean;
  /** Expected serialNumber suffix for the bootloader device (used to verify). */
  serialNumber: string;
}

const usbTarget: UsbTarget[] = [
  { vid: 0x2341, pid: 0x0043 },
  { vid: 0x03EB, pid: 0x2404 }
];

const defaultBootloader: Bootloader = { waiting: false, serialNumber: '' };

let bootloader: Bootloader = { ...defaultBootloader };

// Shared cross-module state: `global.connectedDeviceInfo` is populated after
// a successful GETINFO exchange. Consumers should treat this as nullable and
// check before use. The authoritative type is `ConnectedDeviceInfo` in
// `public/types.ts`.
global.connectedDeviceInfo = null;

/** Active SerialPort instance for the connected device or null when none. */
let port: SerialPort | null = null; // The serialport for the connected device

/**
 * Enumerate serial ports and filter out Bluetooth entries.
 *
 * Returns the raw result from `SerialPort.list()` filtered for device
 * candidates. Callers still need to match VID/PID to confirm compatibility.
 */
const getPorts = async (): Promise<PortInfo[]> => {
  try {
    const rawPorts: any[] = await SerialPort.list();
    const filtered = rawPorts.filter((prt) => prt.path && !prt.path.includes("BLTH") && !prt.path.includes("Bluetooth"));
    const mapped: PortInfo[] = filtered.map((prt) => {
      const pi: PortInfo = {
        path: String(prt.path),
        vendorId: prt.vendorId ? String(prt.vendorId) : undefined,
        productId: prt.productId ? String(prt.productId) : undefined,
        serialNumber: prt.serialNumber ? String(prt.serialNumber) : undefined,
        friendlyName: prt.friendlyName ? String(prt.friendlyName) : (prt.manufacturer ? String(prt.manufacturer) : undefined),
        manufacturer: prt.manufacturer ? String(prt.manufacturer) : undefined,
      };
      return pi;
    });
    return mapped;
  } catch (error) {
    throw error;
  }
};

// Protocol helper for streaming arbitrary bytes to the device. The stream
// prefix `WBM:STREAM` is part of the device protocol and is expected by the
// firmware receiver.
const streamMsg = Buffer.from('WBM:STREAM');
/**
 * Send a raw stream payload to the device (no response expected).
 * @param data - array of bytes to send
 */
const sendStream = (data: number[]): void => {
  if (!port) return;
  const dataBuf = Buffer.from(data);
  const out = Buffer.concat([streamMsg, dataBuf]);
  port.write(out, (err) => { if (err) console.error('sendStream error', err); });
};

/**
 * Report whether a device is currently connected and notify renderer via
 * `usb_status` IPC message.
 * @returns boolean indicating connection status
 */
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

/**
 * Query the connected device for its identifying information.
 * This sends `WBM:GETINFO` and parses the `key:val;key:val;...` response.
 * The result is stored in `global.connectedDeviceInfo`.
 *
 * @param serialNumber - serial number string obtained from the OS-level
 *                       enumeration (used as an initial identifier)
 * @throws Error if no port is available or on timeout
 */
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
      // Response format: "key:val;key:val;..."
      const pairs = data.toString().split(";");
      const out: ConnectedDeviceInfo = { serialNumber } as ConnectedDeviceInfo;
      pairs.forEach(pair => {
        if (!pair || !pair.includes(':')) return;
        const [k, v] = pair.split(':');
        // store as string values; device may send numeric strings which
        // consumers can coerce where needed
        out[k] = v ?? undefined;
      });
      // Save globally for other modules to access
      global.connectedDeviceInfo = out;
      exit();
    };

    // Timeout chosen to keep UX responsive; may be adjusted if devices are slow
    let timeout = setTimeout(() => {
      exit(new Error("Timed Out Waiting For Device Info"));
    }, 1000);

    port.on('data', handleData);
    port.write('WBM:GETINFO');
  });
};

/**
 * Open the serial port for the first matching device in `usbTarget`.
 * On success this sets `port` and populates `global.connectedDeviceInfo`.
 *
 * Returns true when a compatible device is opened.
 */
const openPort = async (): Promise<boolean> => {
  const win = getWin();
  try {
    let tempPorts = await getPorts();
    let thePorts = tempPorts.filter(prt => {
      for (let i = 0; i < usbTarget.length; i++) {
        // vendorId/productId can be undefined for certain ports; guard first
        if (!prt.vendorId || !prt.productId) continue;
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
          const serial = thePorts[0].serialNumber;
          if (!serial) {
            console.error('openPort: device has no serialNumber');
            // treat as not connected for our purposes
            resolve(false);
            return;
          }

          if (serial.includes("BOOT:")) {
            global.connectedDeviceInfo = {
              serialNumber: serial,
              model: "mtm2s"
            } as ConnectedDeviceInfo;
            bootEmitter.emit('bootloaderDeviceConnected', serial);
            resolve(true);
          } else {
            win?.webContents.send('usb_status', true);
            await getConnectedDeviceInfo(serial);
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

/**
 * Attempt to open a port; if it fails, retry once after 1s.
 * This function swallows errors to avoid crashing the main process.
 */
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

/**
 * Put the device into program mode by sending `WBM:LOAD` and waiting for
 * a `WBM:READY` response. Promises rejects on timeout or unexpected data.
 */
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

/**
 * Send half a page to the MCU and validate the echoed bytes. Pages are split
 * into PAGE0 and PAGE1 halves by the protocol.
 *
 * @param pageHalf - array of bytes (expected exactly pageHalf.length)
 * @param half - 0 for PAGE0, 1 for PAGE1
 */
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
      // Firmware bootloader echoes the sent bytes; compare arrays by
      // converting to JSON because Buffer equality is not straightforward.
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

/** Send a full 64-byte page as two 32-byte halves. */
const sendPage = async (page: number[]): Promise<void> => {
  await sendHalfPage(page.slice(0, 32), 0);
  await sendHalfPage(page.slice(32, 64), 1);
};

/** Notify the device that the upload is finished and wait for `WBM:DONE`. */
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

/**
 * Send the device a command to reboot into the bootloader and wait for the
 * bootloader device to reconnect. This sets `bootloader.waiting` and stores
 * the expected serial number to verify the reconnect.
 */
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

/** Upload multiple pages (already split) and report progress to the renderer. */
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

/**
 * Pack raw bytes into pages of pageSize bytes. The last page is padded with
 * 0xFF bytes to reach pageSize.
 */
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

/**
 * Ask the device for its flash page size and available space by sending
 * `WBM:GETFLASHINFO` and parsing the expected binary response.
 *
 * Returns an object with `pageSize` (bytes per page) and `availableSpace`.
 */
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
      // Expected binary layout (tail bytes):
      //  ... [availableSpace (4 bytes, BE)] [pageSize (2 bytes, BE)]
      // The code looks for the `WBM:FLASHINFO` marker and then reads the
      // trailer as unsigned big-endian integers.
      if (!data.toString().includes('WBM:FLASHINFO')) {
        exit(undefined, new Error(`Unexpected data in getDeviceInfo ${data.toString()}`));
        return;
      }

      // Validate length: we expect at least 6 bytes for the trailer
      if (data.length < 6) {
        exit(undefined, new Error('getDeviceInfo: response too short'));
        return;
      }

      // Calculate offsets for the trailer (last 6 bytes)
      const trailerOffset = data.length - 6;

      try {
        const availableSpace = data.readUInt32BE(trailerOffset);
        const pageSize = data.readUInt16BE(trailerOffset + 4);
        exit({ pageSize, availableSpace });
      } catch (err) {
        exit(undefined, new Error('getDeviceInfo: failed to parse trailer'));
      }
    };

    const timer = setTimeout(() => exit(undefined, new Error('getDeviceInfo timed out')), 1000);
    port.on('data', handleData);
    port.write('WBM:GETFLASHINFO');
  });
};

/** Write the given data to MCU flash using the bootloader protocol. */
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

/** Convenience wrapper used by higher-level upload flows. */
const upload = async (data: number[]): Promise<void> => {
  console.log("UPLOAD");
  await writeMcuFlash(data);
};

/**
 * Top-level firmware upload handler. Accepts a Buffer and performs the
 * necessary steps depending on whether the device is already in bootloader
 * mode or needs to be rebooted into it.
 */
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

/**
 * Ask the user to select a firmware binary and upload it to the connected
 * device. Returns true on success.
 */
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

/**
 * Upload the 'latest' firmware file packaged for the detected device model.
 * This looks up `latest.json` inside the firmware folder for the model.
 */
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

/**
 * Initialize USB detection and attempt to open the device port on startup.
 * Adds attach/detach handlers and triggers an initial `tryToOpenPort()`.
 */
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