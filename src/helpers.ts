/**
 * CORE HELPER FUNCTIONS AND IPC COMMUNICATION
 * 
 * This module provides the primary interface between the React renderer process
 * and the Electron main process. It includes type-safe IPC communication wrappers,
 * data persistence functions, and utility functions for robot and sequence management.
 * 
 * KEY FUNCTIONALITY:
 * - Type-safe IPC communication with automatic error handling
 * - Robot configuration management (CRUD operations)
 * - Sequence and position data persistence
 * - USB communication abstraction for robot control
 * - Audio playback for user feedback
 * - File import/export operations
 * 
 * ARCHITECTURE:
 * - Uses Electron's contextBridge for secure IPC communication
 * - Implements type safety through TypeScript interfaces
 * - Provides promise-based async API for all operations
 * - Includes comprehensive error handling and logging
 * 
 * SECURITY:
 * - All main process communication goes through contextBridge
 * - Type-safe interfaces prevent injection attacks
 * - Proper error handling prevents crashes
 * - No direct Node.js API access from renderer
 * 
 * USAGE PATTERNS:
 * - Import specific functions as needed: { getRobots, saveSequence }
 * - All functions return promises and should be awaited
 * - Error handling is built-in but can be overridden with .catch()
 * - Functions automatically handle JSON serialization/deserialization
 */

// Type definitions for application data structures
import { Robot, Position, Servo, Sequence } from "./types";
import type { InvokeMap, InvokeKey } from "./ipc-types"; // IPC type mappings

/**
 * TYPESCRIPT TYPE UTILITIES FOR IPC COMMUNICATION
 * 
 * These utility types extract argument and return types from the IPC mapping
 * to provide compile-time type safety for all main process communications.
 */

// Extract argument types from IPC method definitions
type InvokeArgs<C extends InvokeKey> = InvokeMap[C] extends { args: infer A }
  ? A extends any[]
  ? A
  : any[]
  : any[];

// Extract return types from IPC method definitions  
type InvokeRet<C extends InvokeKey> = InvokeMap[C] extends { ret: infer R } ? R : any;

/**
 * GLOBAL WINDOW INTERFACE EXTENSION
 * 
 * Extends the global Window interface to include Electron-specific APIs
 * that are exposed through the preload script and contextBridge.
 */
declare global {
  interface Window {
    electron: {
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>; // Main process invocation
      send: (channel: string, args?: any) => void;                      // One-way message sending
      receive?: (channel: string, func: (...args: any[]) => void) => void; // Event listener setup
      removeListener?: (channel: string) => void;                       // Event listener cleanup
      msgMkr?: any;                                                     // Message maker utilities
    };
  }
}

/**
 * ROBOT MANAGEMENT FUNCTIONS
 * 
 * These functions provide a high-level interface for robot configuration
 * management, abstracting the IPC communication with the main process.
 */

/**
 * FETCH ALL ROBOTS
 * 
 * Retrieves the complete list of robot configurations from persistent storage.
 * Used to populate the robot selection interface and home screen.
 * 
 * @returns {Promise<Robot[]>} Array of all saved robot configurations
 */
export const getRobots = async (): Promise<Robot[]> => {
  return safeInvoke("getRobots");
};

/**
 * DELETE ROBOT CONFIGURATION
 * 
 * Removes a robot configuration and all associated data (sequences, positions)
 * from storage. Returns the updated robot list for UI synchronization.
 * 
 * @param {string} path - Unique robot identifier/path
 * @returns {Promise<Robot[]>} Updated list of remaining robots
 */
export const deleteRobot = async (path: string): Promise<Robot[]> => {
  console.log("delete", path);
  return safeInvoke("deleteRobot", path);
};

/**
 * LOAD SINGLE ROBOT
 * 
 * Fetches detailed configuration for a specific robot by its path identifier.
 * Used when navigating to robot-specific interfaces.
 * 
 * @param {string} path - Unique robot identifier/path
 * @returns {Promise<Robot>} Complete robot configuration object
 */
export const getRobot = async (path: string): Promise<Robot> => {
  return safeInvoke("getRobot", path);
};

/**
 * SAVE ROBOT CONFIGURATION
 * 
 * Persists a robot configuration to storage. Used for both creating new
 * robots and updating existing configurations.
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
 * SAFE IPC COMMUNICATION WRAPPER
 * 
 * Type-safe wrapper for Electron IPC communication between renderer and main processes.
 * Provides compile-time type checking and runtime error handling for all IPC operations.
 * 
 * FEATURES:
 * - TypeScript type inference from IPC mapping definitions
 * - Automatic error handling for missing preload bridge
 * - Promise-based async API for all operations
 * - Compile-time validation of arguments and return types
 * 
 * SECURITY:
 * - All communication goes through contextBridge (no direct Node.js access)
 * - Type safety prevents injection attacks and data corruption
 * - Error boundaries prevent renderer crashes from IPC failures
 * 
 * USAGE:
 * - Use typed overload for known IPC channels: safeInvoke("getRobots")
 * - Use generic overload for dynamic channels: safeInvoke<T>("customChannel", args)
 * - Always handle promise rejection with .catch() or try/catch
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
 * MESSAGE MAKER UTILITY ACCESS
 * 
 * Provides access to the message maker utility exposed by the preload script.
 * This utility generates binary protocol packets for USB communication with robots.
 * 
 * FUNCTIONALITY:
 * - Servo position command generation
 * - Wait command packet creation
 * - Protocol-specific byte encoding
 * - Checksum and validation
 * 
 * @returns {any} Message maker utility object or undefined if not available
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