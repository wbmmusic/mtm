/**
 * TRANSPORT COMPONENT - Sequence Playback and Timeline Control
 * 
 * This component provides the main playback controls for robot sequences, including:
 * - Timeline slider showing sequence progress and position markers
 * - Play/pause/stop/repeat controls for sequence execution
 * - Real-time servo position updates during playback
 * - USB communication for uploading sequences to robot hardware
 * - Visual feedback for timing and current playback position
 * 
 * The Transport acts as the bridge between the sequence editor and the physical robot,
 * converting high-level sequence actions into low-level servo commands and timing data.
 */

// MUI Components for UI layout and controls
import {
  Box,          // Container component for layout
  Button,       // Standard button component (legacy, being replaced with RetroButton)
  Divider,      // Visual separator between sections
  IconButton,   // Circular button for icons (play, stop, etc.)
  Slider,       // Timeline scrubber for sequence navigation
  Stack,        // Flexbox container for button layouts
  Tooltip,      // Hover tooltips for button descriptions
  Typography,   // Text component (legacy, being replaced with PixelText)
} from "@mui/material";

// React hooks and utilities
import React, { useEffect, useState, useContext, useMemo } from "react";

// IPC Communication helpers for Electron main process communication
import {
  safeReceive,      // Safe IPC message receiver with error handling
  safeRemoveListener, // Safe IPC listener cleanup
  safeSend,         // Safe IPC message sender
  getMsgMkr,        // Message maker utility for robot communication protocols
  safeInvoke,       // Safe IPC invoke for request/response patterns
} from "../../helpers";

// Styled components following retro gaming theme
import { RetroButton, PixelText } from "../styled";

// Material Design Icons for transport controls
import PlayArrowIcon from "@mui/icons-material/PlayArrow";     // Play button icon
import StopIcon from "@mui/icons-material/Stop";             // Stop button icon
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious"; // Return to start icon
import RepeatIcon from "@mui/icons-material/Repeat";         // Loop/repeat icon

// Global application state management
import { GlobalContext, GlobalState } from "../../contexts/GlobalContext";

// TypeScript type definitions for sequence actions and servo data
import type { Action, Servo } from "../../types";

/**
 * TRANSPORT COMPONENT MAIN FUNCTION
 * 
 * @param actions - Array of sequence actions (moves, delays, waits) to be executed
 * @returns React functional component for sequence playback controls
 */
export const Transport: React.FC<{ actions: Action[] }> = ({ actions }) => {
  // Global state: USB connection status determines if we can communicate with robot
  const { usbConnected } = useContext(GlobalContext) as GlobalState;

  /**
   * MESSAGE MAKER SETUP
   * 
   * The msgMkr (message maker) is a utility loaded from the preload script that
   * converts high-level robot commands into low-level byte arrays for USB transmission.
   * It handles the protocol specifics for different servo types and wait conditions.
   */
  const msgMkr = getMsgMkr(); // Get message maker from preload context
  
  // Extract message maker functions with proper typing
  const { makeServoPositionData, makeWaitData, waitTypes } = (msgMkr || {}) as {
    makeServoPositionData?: (idx: number, value: number) => number[];  // Servo position command generator
    makeWaitData?: (t: unknown, v: number) => number[];                // Wait condition command generator  
    waitTypes?: Record<string, unknown>;                               // Wait type definitions
  };

  /**
   * MEMOIZED FUNCTION WRAPPERS
   * 
   * These functions provide safe, typed wrappers around the message maker functions
   * with fallbacks if the message maker isn't available (e.g., in test environments)
   */
  const makeServoPositionDataFn = useMemo<
    (idx: number, value: number) => number[]
  >(() => {
    return typeof makeServoPositionData === "function"
      ? makeServoPositionData  // Use actual function if available
      : () => [];              // Fallback: return empty array
  }, [makeServoPositionData]);

  const makeWaitDataFn = useMemo<(t: unknown, v: number) => number[]>(() => {
    return typeof makeWaitData === "function" 
      ? makeWaitData          // Use actual function if available
      : () => [];             // Fallback: return empty array
  }, [makeWaitData]);

  /**
   * TIMELINE MARKS GENERATION
   * 
   * This function processes the sequence actions to create timeline markers that appear
   * on the slider. Each marker represents a point in time where a servo movement or
   * wait condition occurs. Delays accumulate time but don't create markers.
   * 
   * Timeline Structure:
   * - Delays: Add to the timeline duration but create no marker
   * - Moves: Create markers with servo position data at the current time
   * - Waits: Create markers with wait condition data at the current time
   */
  const makeMarks = React.useCallback(() => {
    const out: Array<{
      value: number;        // Time position on timeline (in deciseconds, 0.1s units)
      label: null | string; // Display label (currently unused, always null)
      servos?: Servo[];     // Servo position data for move actions
      key?: number | string; // Wait condition key for wait actions
    }> = [];
    let curTime = 0; // Current time accumulator in deciseconds

    // Process each action in sequence order
    actions.forEach(act => {
      if (act.type === "delay") {
        // Delays advance time but don't create timeline markers
        curTime = curTime + (act.value || 0);
      } else if (act.type === "move") {
        // Move actions create markers with servo position data
        out.push({ value: curTime, label: null, servos: act.servos });
      } else if (act.type === "wait") {
        // Wait actions create markers with wait condition keys
        out.push({ value: curTime, label: null, key: act.key });
      }
    });
    return out;
  }, [actions]); // Regenerate when actions array changes

  /**
   * PLAYBACK STATE MANAGEMENT
   * 
   * These state variables control the timeline playback behavior:
   */
  const [current, setCurrent] = useState<number>(0);              // Current playback position (deciseconds)
  const [intervalId, setIntervalId] = useState<number | null>(null); // Timer ID for playback animation
  const [repeat, setRepeat] = useState(false);                   // Loop playback when reaching end
  const [marks, setMarks] = useState(() => makeMarks());         // Timeline markers for servo/wait events
  const [waitingOnKey, setWaitingOnKey] = useState<string | null>(null); // Current wait condition being processed

  /**
   * PLAYBACK CONTROL FUNCTIONS
   */
  
  /**
   * Reset playback position to the beginning of the sequence
   */
  const returnToStart = () => setCurrent(0);

  /**
   * Calculate total sequence duration by summing all delay values
   * @returns Total duration in deciseconds (0.1s units)
   */
  const duration = React.useCallback(() => {
    let dur = 0;
    actions.forEach(act => {
      if (act.type === "delay") {
        dur = dur + (act.value || 0); // Only delays contribute to total duration
      }
    });
    return dur;
  }, [actions]); // Recalculate when actions change

  /**
   * Stop playback and clear the animation timer
   * Safely handles cases where interval might not exist
   */
  const stop = React.useCallback(() => {
    try {
      if (intervalId !== null) {
        clearInterval(intervalId); // Clear the 100ms animation timer
      }
    } catch (e) {
      // Ignore errors - interval might already be cleared
    }
    setIntervalId(null); // Reset interval ID state
  }, [intervalId]);

  /**
   * Start or pause playback
   * If already playing, this acts as a pause button
   * If paused/stopped, this starts playback from current position
   */
  const play = () => {
    if (intervalId !== null) {
      // Already playing - stop playback (pause behavior)
      stop();
      return;
    }
    // Start playback timer - advances timeline by 1 decisecond every 100ms
    // This creates real-time playback where 1 timeline unit = 0.1 seconds
    const newIntervalId = window.setInterval(
      () => setCurrent(prev => prev + 1), // Increment timeline position
      100 // 100ms interval = 0.1s = 1 decisecond
    );
    setIntervalId(newIntervalId as unknown as number);
  };

  /**
   * SERVO COMMUNICATION AND PLAYBACK CONTROL EFFECT
   * 
   * This effect runs whenever the current playback position changes and handles:
   * 1. Sending servo position commands when timeline markers are reached
   * 2. Managing sequence looping and stopping behavior
   * 3. Converting high-level actions into low-level USB communication packets
   */
  useEffect(() => {
    // Check if current playback position matches any timeline markers
    marks.forEach(mark => {
      if (mark.value === current) {
        const packet: number[] = []; // USB command packet to send to robot
        
        if (mark.servos !== undefined) {
          /**
           * SERVO MOVEMENT PROCESSING
           * 
           * For each servo in the move action:
           * 1. Check if servo is enabled and has a valid position value
           * 2. Convert servo index and position to robot protocol bytes
           * 3. Add the command bytes to the USB packet
           */
          mark.servos.forEach((servo, idx) => {
            if (servo?.enabled && typeof servo.value === "number") {
              // Generate servo position command bytes for this servo
              packet.push(...makeServoPositionDataFn(idx, servo.value));
            }
          });
        } else if (mark.key !== undefined) {
          /**
           * WAIT CONDITION PROCESSING
           * 
           * For wait actions, generate the appropriate wait command.
           * Currently supports remote control input waiting.
           */
          packet.push(...makeWaitDataFn((waitTypes as any)?.remote, 1));
        }

        // Send the command packet to the robot via USB if we have commands
        if (packet.length > 0) {
          safeInvoke("sendValue", packet).catch((err: unknown) =>
            console.log("Servo communication error:", err)
          );
        }
      }
    });

    /**
     * SEQUENCE END HANDLING
     * 
     * When playback exceeds the total sequence duration:
     * - If repeat is enabled: restart from beginning
     * - If repeat is disabled: stop playback
     */
    if (current > duration()) {
      if (repeat) {
        returnToStart(); // Loop back to start
      } else {
        stop(); // End playback
      }
    }
  }, [
    current,                  // Playback position
    marks,                   // Timeline markers
    repeat,                  // Loop setting
    duration,                // Total sequence duration
    stop,                    // Stop function
    makeServoPositionDataFn, // Servo command generator
    makeWaitDataFn,          // Wait command generator
    waitTypes,               // Wait type definitions
  ]);

  /**
   * TIMELINE MARKS GENERATION EFFECT
   * 
   * Regenerates the timeline marks whenever the sequence actions change.
   * This ensures the slider component shows markers at the correct positions
   * for all move and wait actions in the sequence.
   */
  useEffect(() => {
    setMarks(makeMarks());
  }, [makeMarks]);

  /**
   * REMOTE CONTROL KEY PRESS HANDLING EFFECT
   * 
   * Sets up IPC listener for remote control key presses from the main process.
   * When a wait action is waiting for a specific key and that key is pressed:
   * 1. Clear the waiting state to resume playback
   * 2. Allow the sequence to continue to the next action
   * 
   * Cleanup function removes the listener when component unmounts or dependency changes.
   */
  useEffect(() => {
    safeReceive("keyPress", (key: unknown) => {
      if (key === waitingOnKey) {
        setWaitingOnKey(null); // Resume playback
      }
    });

    // Cleanup: remove IPC listener to prevent memory leaks
    return () => {
      safeRemoveListener("keyPress");
    };
  }, [waitingOnKey]);

  /**
   * SEQUENCE UPLOAD HANDLER
   * 
   * Sends the current sequence actions to the main process for upload to the robot.
   * The main process will convert the high-level actions into robot firmware format
   * and store them in the robot's memory for standalone execution.
   */
  const handleUpload = () => {
    safeSend("upload", actions);
  };

  /**
   * UPLOAD AVAILABILITY CHECK
   * 
   * Determines if the upload button should be enabled.
   * Upload is only available when USB connection to robot is established.
   * 
   * @returns {boolean} true if robot is connected via USB
   */
  const uploadable = () => usbConnected;

  /**
   * TRANSPORT COMPONENT RENDER
   * 
   * The transport control panel provides a comprehensive interface for sequence playback:
   * 
   * TIMELINE SLIDER:
   * - Shows current playback position with markers for each action
   * - Allows scrubbing to any position in the sequence
   * - Visual indicators for move actions and wait conditions
   * 
   * PLAYBACK CONTROLS:
   * - Play/Pause: Start/stop sequence execution with visual feedback
   * - Stop: Reset to beginning and halt playback
   * - Repeat: Toggle looping behavior for continuous playback
   * 
   * UPLOAD FUNCTIONALITY:
   * - Send sequence to robot for standalone execution
   * - Only enabled when USB connection is active
   * 
   * TIME DISPLAY:
   * - Current position and total duration in seconds
   * - Updates in real-time during playback
   * 
   * STYLING:
   * - Retro gaming aesthetic with pixel fonts and silver background
   * - Responsive layout that adapts to different screen sizes
   * - Consistent with overall application theme
   */
  return (
    <Box>
      <Stack>
        <Box
          sx={{
            // padding: "15px",
            pr: 1,
            pl: 1,
            backgroundColor: "#d3d3d3",
            border: "2px solid #55533c",
            borderBottom: "none",
          }}
        >
          <Slider
            marks={marks}
            value={current}
            min={0}
            step={1}
            max={duration()}
            onChange={(_, value) => setCurrent(Number(value))}
            componentsProps={{
              rail: {
                style: {
                  color: "#d3d3d3",
                  backgroundColor: "#d3d3d3",
                  height: "14px",
                  borderRadius: "0px",
                  border: "1px solid #55533c",
                },
              },
              track: {
                style: {
                  color: "#ffa500",
                  backgroundColor: "#ffa500",
                  height: "14px",
                  borderRadius: "0px",
                  border: "1px solid #55533c",
                },
              },
              thumb: {
                style: { display: "none" },
              },
              mark: {
                style: {
                  color: "#32cd32",
                  backgroundColor: "#32cd32",
                  padding: "3px",
                  border: "1px solid #55533c",
                },
              },
            }}
          />
        </Box>
        <Divider />
        <Stack
          direction="row"
          justifyContent="space-between"
          width="100%"
          sx={{
            backgroundColor: "#ffa500", // orange theme color
            padding: 1,
            border: "2px solid #55533c",
          }}
        >
          <Stack direction="row">
            <Tooltip title="Go to start">
              <IconButton
                aria-label="return"
                size="large"
                onMouseDown={returnToStart}
                color="inherit"
              >
                <SkipPreviousIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Play">
              <IconButton
                aria-label="play"
                size="large"
                onMouseDown={play}
                color="inherit"
              >
                <PlayArrowIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Stop">
              <IconButton
                aria-label="delete"
                size="large"
                onMouseDown={stop}
                color="inherit"
              >
                <StopIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Repeat">
              <IconButton
                aria-label="repeat"
                size="large"
                color={repeat ? "success" : "inherit"}
                onMouseDown={() => setRepeat(prev => !prev)}
              >
                <RepeatIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack>
            <RetroButton
              sx={{ margin: "auto" }}
              variant="contained"
              onClick={handleUpload}
              disabled={!uploadable()}
            >
              Upload
            </RetroButton>
          </Stack>
          <Box sx={{ margin: "auto 0px" }}>
            <PixelText
              sx={{
                width: "200px",
                whiteSpace: "nowrap",
                marginRight: "4px",
                textAlign: "right",
                fontSize: "14px",
                color: "#000000",
              }}
            >
              {current / 10 + " / " + duration() / 10 + " sec"}
            </PixelText>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};
