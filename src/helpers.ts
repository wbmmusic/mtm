import { Robot, Position, Servo, Sequence } from "./types";
import type { InvokeMap, InvokeKey } from "./ipc-types";

// Derive argument tuple and return types from InvokeMap safely.
type InvokeArgs<C extends InvokeKey> = InvokeMap[C] extends { args: infer A }
  ? A extends any[]
    ? A
    : any[]
  : any[];
type InvokeRet<C extends InvokeKey> = InvokeMap[C] extends { ret: infer R } ? R : any;

declare global {
  interface Window {
    electron: {
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
      send: (channel: string, args?: any) => void;
      receive?: (channel: string, func: (...args: any[]) => void) => void;
      removeListener?: (channel: string) => void;
      msgMkr?: any;
    };
  }
}

/**
 * Fetch the list of robots saved in the main process.
 * @returns Promise resolving to an array of Robot objects.
 */
export const getRobots = async (): Promise<Robot[]> => {
  return safeInvoke("getRobots");
};

/**
 * Delete a robot by path and return the updated robot list.
 * @param path - robot identifier/path
 */
export const deleteRobot = async (path: string): Promise<Robot[]> => {
  console.log("delete", path);
  return safeInvoke("deleteRobot", path);
};

/**
 * Load a single robot by path.
 * @param path - robot identifier/path
 */
export const getRobot = async (path: string): Promise<Robot> => {
  return safeInvoke("getRobot", path);
};

/**
 * Save a robot to storage.
 * @param robot - Robot object to save
 */
export const saveRobot = async (robot: Robot): Promise<Robot> => {
  return safeInvoke("saveRobot", robot);
};

export const getPositions = async (robotPath: string): Promise<Position[]> => {
  return safeInvoke("getPositions", robotPath);
};

export const createPosition = async (path: string, position: Position): Promise<Position[]> => {
  return safeInvoke("createPosition", path, position);
};

export const deletePosition = async (path: string, position: Position): Promise<Position[]> => {
  return safeInvoke("deletePosition", path, position);
};

export const updatePosition = async (robotPath: string, position: Position): Promise<Position[]> => {
  return safeInvoke("updatePosition", robotPath, position);
};

export const saveSequence = async (robotPath: string, sequence: Sequence): Promise<Sequence> => {
  return safeInvoke("saveSequence", robotPath, sequence);
};

export const deleteSequence = async (robotPath: string, sequence: Sequence): Promise<Sequence[]> => {
  return safeInvoke("deleteSequence", robotPath, sequence);
};

export const updateSequence = async (robotPath: string, sequence: Sequence): Promise<Sequence> => {
  return safeInvoke("updateSequence", robotPath, sequence);
};

export const getSequence = async (robotPath: string, sequenceID: string): Promise<Sequence> => {
  return safeInvoke("getSequence", robotPath, sequenceID);
};

export const getServos = async (robotPath: string): Promise<Servo[]> => {
  return safeInvoke("getServos", robotPath);
};

// Centralized safe wrappers around preload methods
/**
 * Safely invoke an IPC method exposed by the preload script.
 * If the preload bridge is unavailable this will return a rejected Promise.
 *
 * @template T - expected return type
 * @param channel - channel name
 * @param args - arguments to forward to the main process
 * @returns Promise<T>
 */
/**
 * Typed safeInvoke — when called with a key from InvokeKey the TypeScript
 * compiler can infer the expected argument and return shapes using InvokeMap.
 */
export function safeInvoke<C extends InvokeKey>(channel: C, ...args: InvokeArgs<C>): Promise<InvokeRet<C>>;
export function safeInvoke<T = any>(channel: string, ...args: any[]): Promise<T> {
  const invoke = window.electron?.invoke;
  if (!invoke) {
    return Promise.reject(new Error(`preload.invoke not available for channel ${channel}`));
  }
  return invoke<T>(channel as any, ...args);
}

/**
 * Return the msgMaker helper exposed by preload (if present).
 * This helper produces the binary packets used by the robot protocol.
 */
export function getMsgMkr(): any {
  return window.electron?.msgMkr;
}

/**
 * Send a fire-and-forget IPC message to the main process.
 * If the preload bridge is not available this is a no-op and will warn.
 *
 * @param channel - channel name
 * @param args - optional single argument payload
 */
export function safeSend(channel: string, args?: any): void {
  const send = window.electron?.send;
  if (!send) {
    // eslint-disable-next-line no-console
    console.warn(`preload.send not available for channel ${channel}`);
    return;
  }
  send(channel, args);
}

/**
 * Register a callback for an IPC channel.
 * If preload.receive is not available this is a no-op and will warn.
 *
 * @param channel - channel name
 * @param fn - callback invoked with the payload from main
 */
export function safeReceive(channel: string, fn: (...args: any[]) => void): void {
  const receive = window.electron?.receive;
  if (!receive) {
    // eslint-disable-next-line no-console
    console.warn(`preload.receive not available for channel ${channel}`);
    return;
  }
  receive(channel, fn);
}

/**
 * Remove the listener for a channel previously registered with safeReceive.
 * If the preload bridge is not available this is a no-op and will warn.
 *
 * @param channel - channel name to remove
 */
export function safeRemoveListener(channel: string): void {
  const remove = window.electron?.removeListener;
  if (!remove) {
    // eslint-disable-next-line no-console
    console.warn(`preload.removeListener not available for channel ${channel}`);
    return;
  }
  remove(channel);
}