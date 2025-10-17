import { ipcMain, dialog } from 'electron';
import { existsSync, readFileSync, rmdirSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { upload, uploadFirmware, sendStream, usbStatus } from './usb';
import { getRobots, pathToRobots, generateSequenceBuffer, prepareActions, saveSettings } from './utils';
import { getWin } from './main';
import type { Robot, Position, Sequence, Servo } from './types';

// Settings interface
interface Settings {
  sound: boolean;
}

declare global {
  var settings: Settings;
}

ipcMain.on('uploadFirmware', () => uploadFirmware());

ipcMain.on('upload', async (e, actions: any[]) => {
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
  return getRobots();
});

ipcMain.handle('getRobot', async (e, path: string) => {
  const pathToRobot = join(pathToRobots, path, 'robot.json');
  if (!existsSync(pathToRobot)) throw new Error('Path to robot' + path + " does not exist");
  const bot = JSON.parse(readFileSync(pathToRobot, 'utf8')) as Robot;
  return bot;
});

ipcMain.handle('deleteRobot', async (e, path: string) => {
  console.log("Delete Robot", path);
  const robotPath = join(pathToRobots, path);
  if (existsSync(robotPath)) rmdirSync(robotPath, { recursive: true });
  else throw new Error('Folder with path ' + path + " does not exist");
  return getRobots();
});

ipcMain.handle('saveRobot', async (e, robot: Robot) => {
  console.log("Save Robot", robot.name);
  const robotPath = join(pathToRobots, robot.path!);
  const robotFilePath = join(robotPath, 'robot.json');

  if (existsSync(robotPath)) {
    throw new Error("Robot folder path already exists");
  }
  mkdirSync(robotPath);
  writeFileSync(robotFilePath, JSON.stringify(robot, null, ' '));
  return undefined;
});

ipcMain.handle('updateRobot', async (e, robot: Robot, oldPath?: string) => {
  const robotPath = join(pathToRobots, robot.path!);
  const robotFilePath = join(robotPath, 'robot.json');

  if (oldPath) {
    const oldRobotFolderPath = join(pathToRobots, oldPath);
    if (!existsSync(oldRobotFolderPath)) throw new Error('Cant find oldPath ' + oldPath);
    rmdirSync(oldRobotFolderPath, { recursive: true });
    mkdirSync(robotPath);
    writeFileSync(robotFilePath, JSON.stringify(robot));
    const updatedRobot = readFileSync(robotFilePath, 'utf8');
    return updatedRobot;
  }

  if (!existsSync(robotFilePath)) throw new Error("Can't find robot at " + robot.path);
  writeFileSync(robotFilePath, JSON.stringify(robot, null, ' '));
  const updatedRobot = JSON.parse(readFileSync(robotFilePath, 'utf8')) as Robot;
  return updatedRobot;
});

ipcMain.handle('deleteUserRobots', async () => {
  const robots = getRobots();
  robots.forEach((robot: Robot) => {
    rmdirSync(join(pathToRobots, robot.path!), { recursive: true });
  });
  return 'deleted all user robots';
});

ipcMain.handle('exportRobot', async (e, path: string) => {
  const win = getWin();
  if (!win) throw new Error('No window available');

  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');
  const res = await dialog.showSaveDialog(win, { 
    title: 'Export Robot', 
    filters: [{ name: 'Robot File', extensions: ['json'] }] 
  });

  if (res.canceled) return 'canceled';
  const outputPath = normalize(res.filePath!);
  cpSync(robotFilePath, outputPath);
  return outputPath;
});

ipcMain.handle('createPosition', async (e, path: string, position: Position) => {
  console.log("Create Position", position.name);
  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');

  if (!existsSync(robotFilePath)) throw new Error('Cant find robot file ' + path);
  const tempFile = JSON.parse(readFileSync(robotFilePath, 'utf8')) as Robot;
  tempFile.positions = tempFile.positions || [];
  tempFile.positions.push(position);
  writeFileSync(robotFilePath, JSON.stringify(tempFile, null, ' '));
  return tempFile.positions;
});

ipcMain.handle('deletePosition', async (e, path: string, position: Position) => {
  console.log("Delete Position", position.name);
  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');

  if (!existsSync(robotFilePath)) throw new Error('Cant find robot file ' + path);
  const tempFile = JSON.parse(readFileSync(robotFilePath, 'utf8')) as Robot;
  tempFile.positions = (tempFile.positions || []).filter((pos: Position) => pos.name !== position.name);
  writeFileSync(robotFilePath, JSON.stringify(tempFile, null, ' '));
  return tempFile.positions;
});

ipcMain.handle('updatePosition', async (e, path: string, position: Position) => {
  console.log("Update Position", position.name);
  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');

  if (!existsSync(robotFilePath)) throw new Error('Cant find robot file ' + path);
  const tempFile = JSON.parse(readFileSync(robotFilePath, 'utf8')) as Robot;
  const positionIdx = (tempFile.positions || []).findIndex((pos: Position) => pos.appId === position.appId);
  if (positionIdx < 0) throw new Error('Didnt find position with appID' + position.appId);
  tempFile.positions![positionIdx] = position;
  writeFileSync(robotFilePath, JSON.stringify(tempFile, null, ' '));
  return tempFile.positions;
});

ipcMain.handle("getPositions", async (e, path: string) => {
  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');
  const positions = JSON.parse(readFileSync(robotFilePath, 'utf8')).positions as Position[];
  return positions;
});

ipcMain.handle('saveSequence', async (e, path: string, sequence: Sequence) => {
  console.log("New Sequence", sequence.name);
  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');
  const tempRobot = JSON.parse(readFileSync(robotFilePath, 'utf8')) as Robot;
  tempRobot.sequences = tempRobot.sequences || [];
  tempRobot.sequences.push(sequence);
  writeFileSync(robotFilePath, JSON.stringify(tempRobot, null, ' '));
  return "Saved New Sequence " + sequence.name;
});

ipcMain.handle('deleteSequence', async (e, path: string, sequence: Sequence) => {
  console.log("Delete Sequence", sequence.appId);
  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');
  const tempRobot = JSON.parse(readFileSync(robotFilePath, 'utf8')) as Robot;
  const seqId = (tempRobot.sequences || []).findIndex((s: Sequence) => s.appId === sequence.appId);
  if (seqId < 0) throw new Error('Didnt Find Sequence');
  tempRobot.sequences!.splice(seqId, 1);
  writeFileSync(robotFilePath, JSON.stringify(tempRobot, null, ' '));
  return tempRobot.sequences;
});

ipcMain.handle('updateSequence', async (e, path: string, sequence: Sequence) => {
  console.log("Update Sequence", sequence.appId);
  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');
  const tempRobot = JSON.parse(readFileSync(robotFilePath, 'utf8')) as Robot;
  const seqIdx = (tempRobot.sequences || []).findIndex((s: Sequence) => s.appId === sequence.appId);
  if (seqIdx < 0) throw new Error('Didnt Find Sequence');
  tempRobot.sequences!.splice(seqIdx, 1, sequence);
  writeFileSync(robotFilePath, JSON.stringify(tempRobot, null, ' '));
  return tempRobot.sequences;
});

ipcMain.handle('getSequence', async (e, path: string, sequenceID: string) => {
  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');
  const tempSequences = JSON.parse(readFileSync(robotFilePath, 'utf8')).sequences as Sequence[];
  const seqIdx = tempSequences.findIndex((s: Sequence) => s.appId === sequenceID);
  if (seqIdx < 0) throw new Error('Didnt Find Sequence');
  return tempSequences[seqIdx];
});

ipcMain.handle('getServos', async (e, path: string) => {
  console.log("Get Servos Sequence", path);
  const robotPath = join(pathToRobots, path);
  const robotFilePath = join(robotPath, 'robot.json');
  const bot = JSON.parse(readFileSync(robotFilePath, 'utf8')) as Robot;
  return bot.servos as Servo[];
});

ipcMain.handle('getSound', () => global.settings?.sound || false);

ipcMain.handle('startKeyfobProgramming', async () => {
  if (!usbStatus()) {
    throw new Error('No USB device connected');
  }
  // TODO: Send WBM:PROGRAM_KEYFOB command to device
  console.log('Starting keyfob programming mode');
  return true;
});

ipcMain.handle('programKeyfobButton', async (e, buttonId: number) => {
  if (!usbStatus()) {
    throw new Error('No USB device connected');
  }
  // TODO: Send WBM:PROGRAM_BUTTON + buttonId to device
  console.log('Programming keyfob button', buttonId);
  return true;
});

ipcMain.handle('testKeyfobButton', async (e, buttonId: number) => {
  if (!usbStatus()) {
    throw new Error('No USB device connected');
  }
  // TODO: Test if keyfob button works
  console.log('Testing keyfob button', buttonId);
  return true;
});