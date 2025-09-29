import { app } from 'electron';
import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { makeServoPositionData, makeDelayData, makeWaitData, waitTypes } from './msgMaker';

interface Settings {
  sound: boolean;
}

interface Robot {
  name: string;
  path: string;
  [key: string]: unknown;
}

interface Action {
  type: 'delay' | 'move' | 'wait';
  value?: number;
  key?: string;
  servos?: Array<{ enabled: boolean; value: number }>;
  content?: unknown;
}

const pathToUserData = join(app.getPath('userData'), 'data');
const pathToUserSettings = join(pathToUserData, 'settings.json');
const pathToRobots = join(pathToUserData, 'robots');
const pathToFirmwareFolder = join(pathToUserData, 'firmware');

declare global {
  var settings: Settings;
}

const readSettings = (): Settings => {
  return JSON.parse(readFileSync(pathToUserSettings, 'utf8'));
};

const saveSettings = (): void => {
  writeFileSync(pathToUserSettings, JSON.stringify(global.settings, null, ' '));
  global.settings = readSettings();
};

const checkFolders = (): void => {
  const defaultSettings: Settings = {
    sound: true
  };
  
  if (!existsSync(pathToUserData)) mkdirSync(pathToUserData);
  if (!existsSync(pathToRobots)) mkdirSync(pathToRobots);
  if (!existsSync(pathToFirmwareFolder)) mkdirSync(pathToFirmwareFolder);
  
  if (!existsSync(pathToUserSettings)) {
    global.settings = defaultSettings;
    saveSettings();
  } else {
    global.settings = readSettings();
  }
};

const getRobots = (): Robot[] => {
  const folders = readdirSync(pathToRobots, { withFileTypes: true }).filter(dirent => dirent.isDirectory());
  let robots: Robot[] = [];
  
  folders.forEach(folder => {
    const pathToRobot = join(pathToRobots, folder.name);
    const pathToRobotFile = join(pathToRobot, 'robot.json');
    
    if (existsSync(pathToRobot) && existsSync(pathToRobotFile)) {
      robots.push(JSON.parse(readFileSync(pathToRobotFile, 'utf8')));
    }
  });
  
  return robots;
};

// Merge serial positions and serial delays & Strip unnecessary elements
const prepareActions = (actions: Action[]): Action[] => {
  let out: Action[] = [];

  actions.forEach((act, idx) => {
    // Strip elements we no longer need
    delete act.content;
    // If it is a wait we don't need the value element (we use .key)
    if (act.type === 'wait') delete act.value;

    const prevIdx = out.length - 1;

    // If this is the first action we know it needs to go into the output
    if (idx === 0) {
      out.push(act);
    } else {
      // If this action has the same type as the previous action
      if (out[prevIdx].type === act.type) {
        if (act.type === 'delay') {
          // We just add the value of this delay action to the current value
          out[prevIdx].value = (out[prevIdx].value || 0) + (act.value || 0);
        } else if (act.type === 'move') {
          // Check the action for any enabled servos
          act.servos?.forEach((srv, idx) => {
            // if this servo is enabled in the action we want its data
            if (srv.enabled) {
              // Initialize servos array if it doesn't exist
              if (!out[prevIdx].servos) out[prevIdx].servos = [];
              if (!out[prevIdx].servos![idx]) out[prevIdx].servos![idx] = { enabled: false, value: 0 };
              
              // Overwrite or set the servo value
              out[prevIdx].servos![idx].value = srv.value;
              // Overwrite or set the servos enable | This may already be true
              out[prevIdx].servos![idx].enabled = true;
            }
          });
        } else if (act.type === 'wait') {
          // replace entire wait action with this latest one
          out[prevIdx] = act;
        } else {
          console.log("Duplicate UNKNOWN action types in prepareActions()");
          out.push(act);
        }
      } else {
        out.push(act);
      }
    }
  });
  
  return out;
};

// Take prepared actions and turn them into a buffer to be copied to MCU flash
const generateSequenceBuffer = (actions: Action[]): Buffer => {
  let out: number[] = [];

  let timePos = 0;
  actions.forEach(action => {
    if (action.type === 'delay') {
      // move timePos to after this delay
      timePos = timePos + (action.value || 0);

      // write delay bytes to buffer
      out.push(...makeDelayData(timePos));
    } else if (action.type === 'move') {
      action.servos?.forEach((servo, idx) => {
        // If this servo is not used we have no reason to put it in memory
        if (servo.enabled) {
          // write servo bytes to buffer
          out.push(...makeServoPositionData(idx, servo.value));
        }
      });
    } else if (action.type === 'wait') {
      // write wait bytes to buffer
      out.push(...makeWaitData(waitTypes.remote, 1));
    }
  });

  // Add 0xFFFFFFFF to mark the end of the sequence
  out.push(...[255, 255, 255, 255]);
  
  // Return out as a buffer
  return Buffer.from(out);
};

export { checkFolders, getRobots, pathToRobots, pathToFirmwareFolder, prepareActions, generateSequenceBuffer, saveSettings };