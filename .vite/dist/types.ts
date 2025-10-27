/**
 * Information returned by the device in response to `WBM:GETINFO`.
 *
 * Notes:
 * - `serialNumber` is always present and formatted like `WBM:<id>:...` or
 *   `BOOT:<id>:...` depending on normal vs bootloader mode.
 * - `model` and `firmware` are commonly provided but not guaranteed.
 * - Additional keys returned by the device are captured by the index
 *   signature and are restricted to `string | number | undefined` to avoid
 *   allowing arbitrary `any` values across the codebase.
 */
export interface ConnectedDeviceInfo {
  serialNumber: string;
  model?: string;
  firmware?: string;
  [key: string]: string | number | undefined;
}

export interface FirmwareInfo {
  id: string;
  name: string;
  version: string;
  [key: string]: unknown;
}

// Domain types shared by main/renderer
export interface Servo {
  id?: string;
  name?: string;
  index?: number;
  pin?: number;
  value?: number;
  enabled?: boolean;
  type?: string;
  [key: string]: unknown;
}

export interface Position {
  appId: string;
  name: string;
  servos: Servo[];
  [key: string]: unknown;
}

export interface Sequence {
  appId?: string;
  name?: string;
  actions?: unknown[];
  [key: string]: unknown;
}

export interface Robot {
  path?: string;
  name?: string;
  servos?: Servo[];
  positions?: Position[];
  sequences?: Sequence[];
  [key: string]: unknown;
}

declare global {
  var connectedDeviceInfo: ConnectedDeviceInfo | null;
}