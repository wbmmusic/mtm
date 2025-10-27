// Known IPC channel names used by the renderer. This list is a best-effort enumeration
// gathered from the codebase. Adding these overloads lets TypeScript give better
// help at call-sites. If you add new channels in the main process, extend this union.
// Import the mapped IPC types from the project so we can provide per-channel overloads.
import type { InvokeMap, SendMap, ReceiveMap, InvokeKey, SendKey, ReceiveKey } from "./ipc-types";

type InvokeReturn<C extends InvokeKey> = InvokeMap[C] extends { ret: infer R } ? R : unknown;
type InvokeArgs<C extends InvokeKey> = InvokeMap[C] extends { args: infer A } ? A : unknown[];

type SendArgs<C extends SendKey> = SendMap[C] extends { args: infer A } ? A : unknown[];
type ReceiveCb<C extends ReceiveKey> = ReceiveMap[C] extends { cb: infer F } ? F : (...args: any[]) => void;

interface ElectronAPI {
  // Per-channel invoke overloads
  invoke<C extends InvokeKey>(channel: C, ...args: InvokeArgs<C>): Promise<InvokeReturn<C>>;
  // Fallback for unknown channels
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;

  // Per-channel send overloads
  send<C extends SendKey>(channel: C, ...args: SendArgs<C>): void;
  send(channel: string, args?: unknown): void;

  // Per-channel receive/removeListener overloads
  receive<C extends ReceiveKey>(channel: C, fn: ReceiveCb<C>): void;
  removeListener<C extends ReceiveKey>(channel: C): void;

  ver(): string;
  msgMkr: any;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export { };
