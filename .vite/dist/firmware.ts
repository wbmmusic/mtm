import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { downloadFirmware, getDevices, getLatest, getLines, setBase } from 'wbm-version-manager';
import { pathToFirmwareFolder } from './utils';
import { getWin } from './main';

import type { FirmwareInfo } from './types';

interface Device {
  id: string;
  path: string;
  [key: string]: unknown;
}

interface Line {
  id: string;
  name: string;
  [key: string]: unknown;
}

setBase('http://versions.wbmtek.com/api');

const compareToLatest = (): void => {
  const win = getWin();

  if (global.connectedDeviceInfo && win) {
    // Guard: model must be present to select the firmware folder. If missing,
    // bail early — this should not happen in normal operation but is safer
    // when running with strict checks enabled.
    if (!global.connectedDeviceInfo.model) {
      console.log('Connected device missing model');
      return;
    }

    const pathToDeviceFolder = join(pathToFirmwareFolder, global.connectedDeviceInfo.model.toLowerCase());
    const pathToLatestData = join(pathToDeviceFolder, 'latest.json');

    if (existsSync(pathToDeviceFolder)) {
      let latest: FirmwareInfo = JSON.parse(readFileSync(pathToLatestData, 'utf8'));
      const currentFirmware = global.connectedDeviceInfo.firmware ?? '0';
      console.log("Latest", latest.version, "Device", currentFirmware);

      if (latest.version > currentFirmware) {
        console.log("Update Available for model", global.connectedDeviceInfo.model);
        win.webContents.send('firmwareAvailable', latest);
      } else {
        console.log("Connected", global.connectedDeviceInfo.model, "is up to date!");
      }
    } else {
      console.log("Didn't find device folder");
    }
  }
};

const checkForFirmwareUpdates = async (): Promise<void> => {
  try {
    const lines = (await getLines()) as unknown as Line[];
    const mtmLine = lines.find(line => line.name === "MTM");

    if (!mtmLine) {
      throw new Error("MTM line not found");
    }

    const lineID = mtmLine.id;
    const devices = (await getDevices(lineID)) as unknown as Device[];
    console.log(pathToFirmwareFolder);

    devices.forEach(device => {
      const pathToDeviceFolder = join(pathToFirmwareFolder, device.path);
      if (!existsSync(pathToDeviceFolder)) mkdirSync(pathToDeviceFolder);
    });

    for (let i = 0; i < devices.length; i++) {
      // check for latest
      const pathToDeviceFolder = join(pathToFirmwareFolder, devices[i].path);
      const latest = (await getLatest(lineID, devices[i].id)) as unknown as FirmwareInfo | null;

      if (latest) {
        if (!readdirSync(pathToDeviceFolder).includes(latest.name)) {
          const folderContents = readdirSync(pathToDeviceFolder);
          // delete all folder contents
          folderContents.forEach(file => rmSync(join(pathToDeviceFolder, file)));

          await downloadFirmware(latest.id, join(pathToDeviceFolder, latest.name));
          writeFileSync(join(pathToDeviceFolder, 'latest.json'), JSON.stringify(latest, null, '  '));
          compareToLatest();
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

export { checkForFirmwareUpdates, compareToLatest };