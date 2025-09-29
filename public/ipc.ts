import { ipcMain, dialog } from 'electron';
import { existsSync, readFileSync, rmdirSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { upload, uploadFirmware, sendStream, usbStatus } from './usb';
import { getRobots, pathToRobots, generateSequenceBuffer, prepareActions, saveSettings } from './utils';
import { getWin } from './main';

// Settings interface
interface Settings {
  sound: boolean;
}

declare global {
  var settings: Settings;
}

ipcMain.on('uploadFirmware', () => uploadFirmware());

ipcMain.on('upload', async (e, actions) => {
  console.log("-------------- START UPLOAD SEQUENCE --------------");
  if (usbStatus()) {
    const sequenceBuffer = generateSequenceBuffer(prepareActions(actions));
    try {
      const win = getWin();
      win?.webContents.send('upload_progress', { show: true, value: null });
      await upload(Array.from(sequenceBuffer));
      win?.webContents.send('upload_progress', { show: false, value: null });
      console.log("-------------- END UPLOAD SEQUENCE --------------");
    } catch (error) {
      throw error;
    }
  } else {
    console.log('NO PORT!!!!');
  }
});

ipcMain.on('play', (e, file: string) => {
  const win = getWin();
  if (global.settings?.sound && win) {
    win.webContents.send('play_file', file);
  }
});

ipcMain.on('get_usb_status', () => {
  usbStatus();
});

ipcMain.handle('sound', (e, onOff: boolean) => {
  if (global.settings) {
    global.settings.sound = onOff;
    saveSettings();
    return global.settings.sound;
  }
  return false;
});

ipcMain.handle('sendValue', async (e, data: number[]) => {
  console.log("Send Serial", data);
  sendStream(data);
  return true;
});

ipcMain.handle('getRobots', async () => {
  return new Promise((resolve, reject) => {
    let rbts = getRobots();
    resolve(rbts);
  });
});

ipcMain.handle('getRobot', async (e, path: string) => {
  return new Promise((resolve, reject) => {
    try {
      const pathToRobot = join(pathToRobots, path, 'robot.json');
      if (!existsSync(pathToRobot)) throw new Error('Path to robot' + path + " does not exist");
      let bot = JSON.parse(readFileSync(pathToRobot, 'utf8'));
      resolve(bot);
    } catch (error) {
      console.log((error as Error).message);
      reject(error);
    }
  });
});

ipcMain.handle('deleteRobot', async (e, path: string) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("Delete Robot", path);
      const robotPath = join(pathToRobots, path);
      if (existsSync(robotPath)) rmdirSync(robotPath, { recursive: true });
      else throw new Error('Folder with path ' + path + " does not exist");
      let rbts = getRobots();
      resolve(rbts);
    } catch (error) {
      reject(error);
    }
  });
});

ipcMain.handle('saveRobot', async (e, robot: any) => {
  return new Promise((resolve, reject) => {
    console.log("Save Robot", robot.name);
    const robotPath = join(pathToRobots, robot.path);
    const robotFilePath = join(robotPath, 'robot.json');

    if (existsSync(robotPath)) {
      reject(new Error("Robot folder path already exists"));
    } else {
      try {
        mkdirSync(robotPath);
        writeFileSync(robotFilePath, JSON.stringify(robot, null, ' '));
        resolve(undefined);
      } catch (error) {
        reject(error);
      }
    }
  });
});

ipcMain.handle('updateRobot', async (e, robot: any, oldPath?: string) => {
  return new Promise((resolve, reject) => {
    const robotPath = join(pathToRobots, robot.path);
    const robotFilePath = join(robotPath, 'robot.json');

    if (oldPath) {
      const oldRobotFolderPath = join(pathToRobots, oldPath);
      if (existsSync(oldRobotFolderPath)) {
        try {
          rmdirSync(oldRobotFolderPath, { recursive: true });
          mkdirSync(robotPath);
          writeFileSync(robotFilePath, JSON.stringify(robot));
          const updatedRobot = readFileSync(robotFilePath, 'utf8');
          resolve(updatedRobot);
        } catch (error) {
          reject(error);
        }
      } else reject(new Error('Cant find oldPath ' + oldPath));
    } else {
      if (existsSync(robotFilePath)) {
        try {
          writeFileSync(robotFilePath, JSON.stringify(robot, null, ' '));
          const updatedRobot = JSON.parse(readFileSync(robotFilePath, 'utf8'));
          resolve(updatedRobot);
        } catch (error) {
          reject(error);
        }
      } else reject(new Error("Can't find robot at " + robot.path));
    }
  });
});

ipcMain.handle('deleteUserRobots', async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const robots = getRobots();
      robots.forEach((robot: any) => {
        rmdirSync(join(pathToRobots, robot.path), { recursive: true });
      });
      resolve('deleted all user robots');
    } catch (error) {
      reject(error);
    }
  });
});

ipcMain.handle('exportRobot', async (e, path: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const win = getWin();
      if (!win) {
        reject(new Error('No window available'));
        return;
      }

      const robotPath = join(pathToRobots, path);
      const robotFilePath = join(robotPath, 'robot.json');
      const res = await dialog.showSaveDialog(win, { 
        title: 'Export Robot', 
        filters: [{ name: 'Robot File', extensions: ['json'] }] 
      });
      
      if (res.canceled) resolve('canceled');
      else {
        let outputPath = normalize(res.filePath!);
        cpSync(robotFilePath, outputPath);
        resolve(outputPath);
      }
    } catch (error) {
      reject(error);
    }
  });
});

ipcMain.handle('createPosition', async (e, path: string, position: any) => {
  return new Promise(async (resolve, reject) => {
    console.log("Create Position", position.name);
    const robotPath = join(pathToRobots, path);
    const robotFilePath = join(robotPath, 'robot.json');

    if (existsSync(robotFilePath)) {
      try {
        let tempFile = JSON.parse(readFileSync(robotFilePath, 'utf8'));
        tempFile.positions.push(position);
        writeFileSync(robotFilePath, JSON.stringify(tempFile, null, ' '));
        let positions = JSON.parse(readFileSync(robotFilePath, 'utf8')).positions;
        resolve(positions);
      } catch (error) {
        reject(error);
      }
    } else reject('Cant find robot file ' + path);
  });
});

ipcMain.handle('deletePosition', async (e, path: string, position: any) => {
  return new Promise(async (resolve, reject) => {
    console.log("Delete Position", position.name);
    const robotPath = join(pathToRobots, path);
    const robotFilePath = join(robotPath, 'robot.json');

    if (existsSync(robotFilePath)) {
      try {
        let tempFile = JSON.parse(readFileSync(robotFilePath, 'utf8'));
        tempFile.positions = tempFile.positions.filter((pos: any) => pos.name !== position.name);
        writeFileSync(robotFilePath, JSON.stringify(tempFile, null, ' '));
        let positions = JSON.parse(readFileSync(robotFilePath, 'utf8')).positions;
        resolve(positions);
      } catch (error) {
        reject(error);
      }
    } else reject('Cant find robot file ' + path);
  });
});

ipcMain.handle('updatePosition', async (e, path: string, position: any) => {
  return new Promise(async (resolve, reject) => {
    console.log("Update Position", position.name);
    const robotPath = join(pathToRobots, path);
    const robotFilePath = join(robotPath, 'robot.json');

    if (existsSync(robotFilePath)) {
      try {
        let tempFile = JSON.parse(readFileSync(robotFilePath, 'utf8'));
        const positionIdx = tempFile.positions.findIndex((pos: any) => pos.appId === position.appId);
        if (positionIdx < 0) reject('Didnt find position with appID' + position.appId);
        tempFile.positions[positionIdx] = position;
        writeFileSync(robotFilePath, JSON.stringify(tempFile, null, ' '));
        let positions = JSON.parse(readFileSync(robotFilePath, 'utf8')).positions;
        resolve(positions);
      } catch (error) {
        reject(error);
      }
    } else reject('Cant find robot file ' + path);
  });
});

ipcMain.handle("getPositions", async (e, path: string) => {
  return new Promise((resolve, reject) => {
    const robotPath = join(pathToRobots, path);
    const robotFilePath = join(robotPath, 'robot.json');
    try {
      let positions = JSON.parse(readFileSync(robotFilePath, 'utf8')).positions;
      resolve(positions);
    } catch (error) {
      reject(error);
    }
  });
});

ipcMain.handle('saveSequence', async (e, path: string, sequence: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("New Sequence", sequence.name);
      const robotPath = join(pathToRobots, path);
      const robotFilePath = join(robotPath, 'robot.json');
      let tempRobot = JSON.parse(readFileSync(robotFilePath, 'utf8'));
      tempRobot.sequences.push(sequence);
      writeFileSync(robotFilePath, JSON.stringify(tempRobot, null, ' '));
      resolve("Saved New Sequence " + sequence.name);
    } catch (error) {
      reject(error);
    }
  });
});

ipcMain.handle('deleteSequence', async (e, path: string, sequence: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Delete Sequence", sequence.appId);
      const robotPath = join(pathToRobots, path);
      const robotFilePath = join(robotPath, 'robot.json');
      let tempRobot = JSON.parse(readFileSync(robotFilePath, 'utf8'));
      let seqId = tempRobot.sequences.findIndex((s: any) => s.appId === sequence.appId);
      if (seqId < 0) throw new Error('Didnt Find Sequence');
      tempRobot.sequences.splice(seqId, 1);
      writeFileSync(robotFilePath, JSON.stringify(tempRobot, null, ' '));
      let sequences = JSON.parse(readFileSync(robotFilePath, 'utf8')).sequences;
      resolve(sequences);
    } catch (error) {
      reject(error);
    }
  });
});

ipcMain.handle('updateSequence', async (e, path: string, sequence: any) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Update Sequence", sequence.appId);
      const robotPath = join(pathToRobots, path);
      const robotFilePath = join(robotPath, 'robot.json');
      let tempRobot = JSON.parse(readFileSync(robotFilePath, 'utf8'));
      let seqIdx = tempRobot.sequences.findIndex((s: any) => s.appId === sequence.appId);
      if (seqIdx < 0) throw new Error('Didnt Find Sequence');
      tempRobot.sequences.splice(seqIdx, 1, sequence);
      writeFileSync(robotFilePath, JSON.stringify(tempRobot, null, ' '));
      const sequences = JSON.parse(readFileSync(robotFilePath, 'utf8')).sequences;
      resolve(sequences);
    } catch (error) {
      reject(error);
    }
  });
});

ipcMain.handle('getSequence', async (e, path: string, sequenceID: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const robotPath = join(pathToRobots, path);
      const robotFilePath = join(robotPath, 'robot.json');
      let tempSequences = JSON.parse(readFileSync(robotFilePath, 'utf8')).sequences;
      let seqIdx = tempSequences.findIndex((s: any) => s.appId === sequenceID);
      if (seqIdx < 0) throw new Error('Didnt Find Sequence');
      resolve(tempSequences[seqIdx]);
    } catch (error) {
      reject(error);
    }
  });
});

ipcMain.handle('getServos', async (e, path: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Get Servos Sequence", path);
      const robotPath = join(pathToRobots, path);
      const robotFilePath = join(robotPath, 'robot.json');
      const bot = JSON.parse(readFileSync(robotFilePath, 'utf8'));
      resolve(bot.servos);
    } catch (error) {
      reject(error);
    }
  });
});

ipcMain.handle('getSound', () => global.settings?.sound || false);