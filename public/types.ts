export interface ConnectedDeviceInfo {
  serialNumber: string;
  model?: string;
  firmware?: string;
  [key: string]: any;
}

export interface FirmwareInfo {
  id: string;
  name: string;
  version: string;
  [key: string]: any;
}

declare global {
  var connectedDeviceInfo: ConnectedDeviceInfo | null;
}