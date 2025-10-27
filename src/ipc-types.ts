import type { Robot, Sequence, Position, Servo } from "./types";

// Shapes used by send/receive/invoke channels
export type UploadProgress = { show: boolean; value: number | null };
export type FirmwareInfo = { version: string; notes?: string } & Record<string, unknown>;

export interface InvokeMap {
  getRobots: { args: []; ret: Robot[] };
  deleteRobot: { args: [string]; ret: Robot[] };
  getRobot: { args: [string]; ret: Robot };
  saveRobot: { args: [Robot]; ret: Robot };
  getPositions: { args: [string]; ret: Position[] };
  createPosition: { args: [string, Position]; ret: Position[] };
  deletePosition: { args: [string, Position]; ret: Position[] };
  updatePosition: { args: [string, Position]; ret: Position[] };
  saveSequence: { args: [string, Sequence]; ret: Sequence };
  deleteSequence: { args: [string, Sequence]; ret: Sequence[] };
  updateSequence: { args: [string, Sequence]; ret: Sequence };
  getSequence: { args: [string, string]; ret: Sequence };
  getServos: { args: [string]; ret: Servo[] };
  deleteUserRobots: { args: []; ret: any };
  exportRobot: { args: [string]; ret: any };
  updateRobot: { args: [Robot, (string | undefined)?]; ret: any };
  getSound: { args: []; ret: boolean };
  sound: { args: [boolean]; ret: boolean };
  sendValue: { args: [number[]]; ret: void };
  // allow other channels
  [key: string]: { args: any[]; ret: any } | undefined;
}

export interface SendMap {
  play: { args: [string] };
  // upload sends an array of action/packet numbers to the main process for firmware upload
  upload: { args: [unknown[]] };
  uploadFirmware: { args: [] };
  get_usb_status: { args: [] };
  reactIsReady: { args: [] };
  installUpdate: { args: [] };
  // allow other channels
  [key: string]: { args: any[] } | undefined;
}

export interface ReceiveMap {
  play_file: { cb: (file: string) => void };
  upload_progress: { cb: (progress: UploadProgress) => void };
  firmwareAvailable: { cb: (info: FirmwareInfo) => void };
  usb_status: { cb: (connected: boolean) => void };
  updater: { cb: (...args: any[]) => void };
  app_version: { cb: (v: string) => void };
  seq_play_state: { cb: (s: any) => void };
  keyPress: { cb: (k: string) => void };
  [key: string]: { cb: (...args: any[]) => void } | undefined;
}

export type InvokeKey = keyof InvokeMap;
export type SendKey = keyof SendMap;
export type ReceiveKey = keyof ReceiveMap;
