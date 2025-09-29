# IPC Contract

This document summarizes the IPC channels used between the renderer and main process, the expected payload shapes, and small examples for how to use them from the renderer.

Notes
- The app exposes a `window.electron` bridge via preload. Use the safe helper functions in `src/helpers.ts` (safeInvoke, safeSend, safeReceive, safeRemoveListener) instead of calling `window.electron` directly.
- The types shown here are best-effort and derived from the renderer code. If you add or change channels in main, update this document and `src/preload.d.ts`.

## Helper usage (renderer)

Use the exported helpers from `src/helpers.ts`:

- safeInvoke<T>(channel, ...args): Promise<T>  — request/response RPC
- safeSend(channel, payload?) — fire-and-forget messages
- safeReceive(channel, fn) — subscribe to channel messages
- safeRemoveListener(channel) — unsubscribe
- getMsgMkr() — returns the msgMaker helper (used to build binary robot protocol payloads)

Example (invoke):

```ts
import { safeInvoke } from '../helpers';

const robots = await safeInvoke<Robot[]>('getRobots');
```

Example (send/receive):

```ts
import { safeSend, safeReceive, safeRemoveListener } from '../helpers';

safeReceive('upload_progress', (data) => {
  // { show: boolean, value: number | null }
  console.log('progress', data);
});

safeSend('upload', actions);

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
