# IPC Communication Documentation

This document describes the Inter-Process Communication (IPC) channels between the Electron main process and React renderer process in MTM Composer, now fully migrated to TypeScript with strict typing.

## Architecture Overview

The MTM Composer uses a fully typed IPC system with three main communication patterns:

- **Invoke/Handle**: Request-response pattern for synchronous operations  
- **Send/On**: One-way messages from main to renderer
- **SendToMain**: One-way messages from renderer to main

All IPC channels are **strongly typed** using TypeScript interfaces defined in `src/ipc-types.ts` and accessed through helper functions in `src/helpers.ts`. This provides compile-time safety and IntelliSense support.

## Usage Notes
- The app exposes a `window.electron` bridge via preload script (`public/preload.ts`)
- **Always use the typed helper functions** in `src/helpers.ts` instead of calling `window.electron` directly
- All channels are defined in `InvokeMap`, `SendMap`, and `ReceiveMap` in `src/ipc-types.ts`
- Domain types (Servo, Position, Sequence, Robot, Action) are defined in `src/types/index.ts`

## Typed Helper Functions

Use the exported **typed helpers** from `src/helpers.ts` for full TypeScript safety:

### Function Signatures
```typescript
// Request/response with automatic type inference
safeInvoke<TChannel extends keyof InvokeMap>(
  channel: TChannel, 
  ...args: InvokeArgs<TChannel>
): Promise<InvokeRet<TChannel>>

// One-way messages to main process  
safeSend<TChannel extends keyof SendMap>(
  channel: TChannel, 
  data?: SendArgs<TChannel>
): void

// Subscribe to messages from main process
safeReceive<TChannel extends keyof ReceiveMap>(
  channel: TChannel, 
  callback: (data: ReceiveArgs<TChannel>) => void
): () => void // Returns cleanup function

// Binary protocol helper for robot communication
getMsgMkr(): typeof msgMaker
```

### Usage Examples

```typescript
// Robot management with full type safety
const robots = await safeInvoke("getRobots"); // Returns Robot[]
const robot = await safeInvoke("getRobot", robotPath); // Returns Robot
await safeInvoke("saveRobot", robotConfig); // Accepts Robot object

// Sequence operations with validation
const sequence = await safeInvoke("getSequence", robotPath, sequenceId);
await safeInvoke("updateSequence", robotPath, sequenceData);

// Real-time communication
safeSend("play", "timeline_add.mp3"); // Audio feedback
safeReceive("keyPress", (key) => {     // Remote control input
  console.log("Remote key pressed:", key);
});

// USB robot communication
const msgMaker = getMsgMkr();
const packet = msgMaker.makeServoPositionData(servoIndex, position);
await safeInvoke("sendValue", packet);
```

## Type Definitions

### Core Data Structures

```typescript
// Robot configuration
interface Robot {
  appId: string;           // Unique identifier
  name: string;            // Display name
  path: string;            // File system path
  youtubeId?: string;      // Assembly video ID
  servos: Servo[];         // Servo configuration
  sequences?: Sequence[];  // Associated sequences
}

// Servo motor definition
interface Servo {
  name: string;            // User-defined servo name
  enabled: boolean;        // Active in sequences
  value?: number;          // Current position (0-180)
}

// Robot position (servo snapshot)
interface Position {
  appId: string;           // Unique identifier
  name: string;            // User-defined name
  servos: Servo[];         // Servo positions
}

// Sequence action types
interface Action {
  id: string;              // Unique identifier for drag-and-drop
  type: "move" | "delay" | "wait"; // Action category
  appId?: string;          // Reference to position (for move actions)
  value?: number;          // Duration in milliseconds (for delays)
  key?: string;            // Remote key identifier (for waits)
}

// Complete sequence definition
interface Sequence {
  appId: string;           // Unique identifier
  name: string;            // User-defined name
  actions: Action[];       // Ordered sequence steps
  duration: number;        // Total calculated duration
}
```

### IPC Channel Mapping

```typescript
// Main process invoke channels (request/response)
interface InvokeMap {
  // Robot management
  "getRobots": { args: []; ret: Robot[] };
  "getRobot": { args: [path: string]; ret: Robot };
  "saveRobot": { args: [robot: Robot]; ret: Robot };
  "deleteRobot": { args: [path: string]; ret: Robot[] };
  
  // Position management  
  "getPositions": { args: [robotPath: string]; ret: Position[] };
  "createPosition": { args: [robotPath: string, position: Position]; ret: Position[] };
  "updatePosition": { args: [robotPath: string, position: Position]; ret: Position[] };
  "deletePosition": { args: [robotPath: string, position: Position]; ret: Position[] };
  
  // Sequence management
  "getSequence": { args: [robotPath: string, sequenceId: string]; ret: Sequence };
  "saveSequence": { args: [robotPath: string, sequence: Sequence]; ret: Sequence };
  "updateSequence": { args: [robotPath: string, sequence: Sequence]; ret: void };
  "deleteSequence": { args: [robotPath: string, sequence: Sequence]; ret: void };
  
  // Hardware communication
  "sendValue": { args: [packet: number[]]; ret: void };
  "upload": { args: [actions: Action[]]; ret: void };
  "getDisplayScaleFactor": { args: []; ret: number };
  
  // System operations
  "exportRobot": { args: [robotPath: string]; ret: void };
}

// Renderer to main messages (one-way)
interface SendMap {
  "play": string;          // Audio file to play
}

// Main to renderer messages (events)
interface ReceiveMap {
  "keyPress": string;      // Remote control key pressed
  "displayChanged": number; // Display scale factor changed
}
```

## USB Communication Protocol

### Message Structure

The robot communication uses a custom binary protocol over USB serial:

```typescript
// Message maker utility functions
interface MessageMaker {
  // Servo position command (6 bytes)
  makeServoPositionData(servoIndex: number, position: number): number[];
  
  // Wait command (3 bytes)  
  makeWaitData(waitType: number, duration: number): number[];
  
  // System commands
  makeResetCommand(): number[];
  makeUploadCommand(actions: Action[]): number[];
}

// Protocol byte structure
// Servo Command: [0xFF, 0xFE, servoIndex, positionHigh, positionLow, checksum]
// Wait Command: [0xFF, 0xFD, waitType, duration, checksum]
// System Reset: [0xFF, 0xFC, 0x00, checksum]
```

### Communication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │  Electron Main  │    │  Robot Hardware │
│                 │    │                 │    │                 │
│ 1. User Action  │───►│ 2. IPC Handler  │───►│ 3. USB Packet   │
│ (servo change)  │    │ (format bytes)  │    │ (execute move)  │
│                 │    │                 │    │                 │
│ 6. UI Update    │◄───│ 5. Success Resp │◄───│ 4. Acknowledge  │
│ (confirmation)  │    │ (IPC response)  │    │ (status byte)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Hardware Protocol Details

**Servo Position Command:**
- `0xFF 0xFE`: Command header for servo movement
- `servoIndex`: Servo number (0-15)
- `positionHigh`: Upper 8 bits of position (0-180 mapped to 0-1800)
- `positionLow`: Lower 8 bits of position
- `checksum`: XOR of all bytes for error detection

**Wait Command:**
- `0xFF 0xFD`: Command header for wait state
- `waitType`: Wait condition type (0=delay, 1=remote key)
- `duration`: Wait duration in 0.1s units (0-255)
- `checksum`: XOR checksum

**Timing Control:**
- All sequences execute at exactly 10Hz (100ms intervals)
- Commands are queued and executed with precise timing
- Real-time feedback through status acknowledgments

## Error Handling

### IPC Error Patterns

```typescript
// All IPC operations return promises with proper error handling
try {
  const result = await safeInvoke("getRobot", robotPath);
  // Success: use result
} catch (error) {
  // Handle specific error types
  if (error.message.includes("not found")) {
    // Robot doesn't exist
  } else if (error.message.includes("permission")) {
    // Access denied
  } else {
    // Unknown error
  }
}

// Event listeners include error boundaries
safeReceive("keyPress", (key) => {
  try {
    handleKeyPress(key);
  } catch (error) {
    console.error("Key press handling failed:", error);
  }
});
```

### USB Communication Errors

```typescript
// Hardware communication includes retry logic and timeouts
await safeInvoke("sendValue", packet).catch((error) => {
  if (error.message.includes("timeout")) {
    // Robot not responding - check connection
  } else if (error.message.includes("checksum")) {
    // Data corruption - retry command
  } else {
    // Hardware failure - user intervention required
  }
});
```

**Invoke Pattern (Request/Response):**
```typescript
import { safeInvoke } from '../helpers';

// TypeScript automatically infers Robot[] return type
const robots = await safeInvoke('getRobots');

// Upload sequence with type-safe payload
const result = await safeInvoke('upload', sequenceData);
```

Example (send/receive):

```ts
```ts
import { safeSend, safeReceive, safeRemoveListener } from '../helpers';

safeReceive('upload_progress', (data) => {
  // { show: boolean, value: number | null }
  console.log('progress', data);
});

safeSend('upload', actions);
```

## Component Prop Interfaces

### Core Component APIs

```typescript
// Transport component for sequence playback
interface TransportProps {
  actions: Action[];              // Sequence actions to play
  selectedSequence: Sequence;     // Current sequence context
  usbConnected: boolean;          // Hardware connection status
}

// Robot card display component
interface RobotCardProps {
  robot: Robot;                   // Robot configuration to display
  setDelete: (args: {             // Delete modal control
    show: boolean;
    robot?: Robot | null;
  }) => void;
  setRobot: (args: {              // Edit modal control
    mode: "new" | "edit" | null;
    robot?: Robot | null;
  }) => void;
}

// Servo input component
interface ServoInputProps {
  servo: Servo;                   // Current servo configuration
  index: number;                  // Display index (0-based)
  update: (name: string) => void; // Name change callback
  trash: () => void;              // Delete callback
}
```

### Styled Component APIs

```typescript
// Retro confirmation modal
interface RetroConfirmModalProps {
  open: boolean;              // Modal visibility
  title?: string;             // Custom title (default: "Confirm Action")
  message: string;            // Confirmation message
  confirmText?: string;       // Confirm button text (default: "Yes")
  cancelText?: string;        // Cancel button text (default: "Cancel")
  onConfirm: () => void;      // Confirm action callback
  onCancel: () => void;       // Cancel action callback
  danger?: boolean;           // Enable danger styling
}
```

### Context APIs

```typescript
// Global application context
interface GlobalContextType {
  admin: boolean;                    // Admin mode permissions
  usbConnected: boolean;             // Hardware connection status
  globalTimelineLength: number;      // Sequence duration for UI sync
  setGlobalTimelineLength: (length: number) => void;
}

// Dynamic DPI scaling context
interface ScaleContextType {
  scaleFactor: number;               // Current display scale (1.0 = 100%)
  scaledTheme: Theme;                // Theme adjusted for current scale
}
```

// later
safeRemoveListener('upload_progress');
```

---

## Channels

### Invoke (RPC-style)

- getRobots(): Promise<Robot[]>
  - No args. Returns an array of Robot objects.

- deleteRobot(path: string): Promise<Robot[]>
  - Removes a robot and returns the updated list.

- getRobot(path: string): Promise<Robot>
  - Returns a single robot by path.

- saveRobot(robot: Robot): Promise<Robot>
  - Persists a robot and returns the saved entity.

- getPositions(robotPath: string): Promise<Position[]>
- createPosition(robotPath: string, position: Position): Promise<Position[]>
- deletePosition(robotPath: string, position: Position): Promise<Position[]>
- updatePosition(robotPath: string, position: Position): Promise<Position[]>

- saveSequence(robotPath: string, sequence: Sequence): Promise<Sequence>
- deleteSequence(robotPath: string, sequence: Sequence): Promise<Sequence[]>
- updateSequence(robotPath: string, sequence: Sequence): Promise<Sequence>
- getSequence(robotPath: string, sequenceID: string): Promise<Sequence>

- getServos(robotPath: string): Promise<Servo[]>

- deleteUserRobots(): Promise<any>
- exportRobot(path: string): Promise<any>
- updateRobot(robot: Robot, originalPath?: string): Promise<any>

- getSound(): Promise<boolean>
- sound(mute: boolean): Promise<boolean>

- sendValue(packet: number[]): Promise<void>
  - Sends a binary packet to the device via serial/USB.

### Send (fire-and-forget)

- play: payload is the sound filename string (e.g. "open.mp3" or "sequence.mp3")
- upload: payload is the actions/sequence to upload to device
- uploadFirmware: no payload (triggers firmware upload flow)
- get_usb_status: no payload (request current USB status)
- reactIsReady: no payload
- installUpdate: no payload

### Receive (renderer listens for these from main)

- play_file: payload is a filename string
- upload_progress: payload { show: boolean; value: number | null }
- firmwareAvailable: payload is the firmware metadata object
- usb_status: payload boolean
- updater: various update events — renderer receives (eventName, details?) where eventName may be 'checking-for-update', 'update-available', 'download-progress', 'update-downloaded', 'relaunching', 'error'
- app_version: payload is a string
- seq_play_state: payload various playback state object
- keyPress: payload is the key identifier pressed

---

## Binary/firmware/robot protocol

The renderer uses a `msgMaker` helper (exposed on `window.electron.msgMkr`) to build binary packets for servo/robot actions.

- Use `getMsgMkr()` from `src/helpers.ts` to retrieve the helper instead of accessing `window.electron.msgMkr` directly.
- Typical flow:
  - const mk = getMsgMkr();
  - const packet = mk.makeServoPositionData(servoIndex, value);
  - safeInvoke('sendValue', packet);

---

## Notes & best practices

- Prefer `safeInvoke`/`safeSend`/`safeReceive`/`safeRemoveListener` in renderer code. They gracefully degrade when preload isn't present (for example during unit tests).
- Keep channel names stable — changing channel names requires updating both main and renderer code and `src/preload.d.ts` & `docs/IPC.md`.
- For any new channels, add a typed entry in `src/preload.d.ts` (InvokeChannel / SendChannel / ReceiveChannel) to get better compile-time checks.

---

If you'd like, I can also generate TypeScript types describing the exact payload shapes (Robot/Sequence/Position/Servo) in `src/types` and then refine the `preload.d.ts` invoke overloads to use those payload types for stronger typing.
