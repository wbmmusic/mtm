import {
  Box,
  Button,
  Divider,
  IconButton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState, useContext, useMemo } from "react";
import { safeReceive, safeRemoveListener, safeSend, getMsgMkr, safeInvoke } from "../../helpers";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import RepeatIcon from "@mui/icons-material/Repeat";
import { GlobalContext, GlobalState } from "../../contexts/GlobalContext";

import type { Action, Servo } from "../../types";

export const Transport: React.FC<{ actions: Action[] }> = ({ actions }) => {
  const { usbConnected } = useContext(GlobalContext) as GlobalState;

  // msgMkr comes from preload; keep it unknown and validate at runtime
  const msgMkr = getMsgMkr();
  const { makeServoPositionData, makeWaitData, waitTypes } = (msgMkr || {}) as {
    makeServoPositionData?: (idx: number, value: number) => number[];
    makeWaitData?: (t: unknown, v: number) => number[];
    waitTypes?: Record<string, unknown>;
  };

  const makeServoPositionDataFn = useMemo<((idx: number, value: number) => number[])>(() => {
    return typeof makeServoPositionData === "function" ? makeServoPositionData : () => [];
  }, [makeServoPositionData]);

  const makeWaitDataFn = useMemo<((t: unknown, v: number) => number[])>(() => {
    return typeof makeWaitData === "function" ? makeWaitData : () => [];
  }, [makeWaitData]);

  const makeMarks = React.useCallback(() => {
    const out: Array<{ value: number; label: null | string; servos?: Servo[]; key?: number | string }> = [];
    let curTime = 0;

    actions.forEach((act) => {
      if (act.type === "delay") {
        curTime = curTime + (act.value || 0);
      } else if (act.type === "move") {
  out.push({ value: curTime, label: null, servos: act.servos });
      } else if (act.type === "wait") {
  out.push({ value: curTime, label: null, key: act.key });
      }
    });
    return out;
  }, [actions]);

  const [current, setCurrent] = useState<number>(0);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [marks, setMarks] = useState(() => makeMarks());
  const [waitingOnKey, setWaitingOnKey] = useState<string | null>(null);

  const returnToStart = () => setCurrent(0);

  const duration = React.useCallback(() => {
    let dur = 0;
    actions.forEach((act) => {
      if (act.type === "delay") dur = dur + (act.value || 0);
    });
    return dur;
  }, [actions]);

  const stop = React.useCallback(() => {
    try {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    } catch (e) {}
    setIntervalId(null);
  }, [intervalId]);

  const play = () => {
    if (intervalId !== null) {
      stop();
      return;
    }
    const newIntervalId = window.setInterval(() => setCurrent((prev) => prev + 1), 100);
    setIntervalId(newIntervalId as unknown as number);
  };

  useEffect(() => {
    marks.forEach((mark) => {
      if (mark.value === current) {
        const packet: number[] = [];
        if (mark.servos !== undefined) {
          mark.servos.forEach((servo, idx) => {
            if (servo?.enabled && typeof servo.value === "number") {
              packet.push(...makeServoPositionDataFn(idx, servo.value));
            }
          });
        } else if (mark.key !== undefined) {
          packet.push(...makeWaitDataFn((waitTypes as any)?.remote, 1));
        }

        if (packet.length > 0) {
          safeInvoke("sendValue", packet).catch((err: unknown) => console.log(err));
        }
      }
    });

    if (current > duration()) {
      if (repeat) returnToStart();
      else stop();
    }
  }, [current, marks, repeat, duration, stop, makeServoPositionDataFn, makeWaitDataFn, waitTypes]);

  useEffect(() => {
    setMarks(makeMarks());
  }, [makeMarks]);

  useEffect(() => {
    safeReceive("keyPress", (key: unknown) => {
      if (key === waitingOnKey) {
        setWaitingOnKey(null);
      }
    });

    return () => {
      safeRemoveListener("keyPress");
    };
  }, [waitingOnKey]);

  const handleUpload = () => {
    safeSend("upload", actions);
  };

  const uploadable = () => usbConnected;

  return (
    <Box>
      <Stack>
        <Box sx={{ padding: "0px 15px" }}>
          <Slider
            marks={marks}
            value={current}
            min={0}
            step={1}
            max={duration()}
            onChange={(_, value) => setCurrent(Number(value))}
            componentsProps={{
              rail: {
                style: { color: "red", height: "14px", borderRadius: "0px" },
              },
              track: {
                style: {
                  color: "orangeRed",
                  height: "14px",
                  borderRadius: "0px",
                },
              },
              thumb: {
                style: { display: "none" },
              },
              mark: {
                style: { color: "dodgerBlue", padding: "3px" },
              },
            }}
          />
        </Box>
        <Divider />
        <Stack
          direction="row"
          justifyContent="space-between"
          width="100%"
          sx={{ backgroundColor: "lime" }}
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
                onMouseDown={() => setRepeat((prev) => !prev)}
              >
                <RepeatIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack>
            <Button sx={{ margin: "auto" }} variant="contained" onClick={handleUpload} disabled={!uploadable()}>
              Upload
            </Button>
          </Stack>
          <Box sx={{ margin: "auto 0px" }}>
            <Typography
              width="200px"
              sx={{
                whiteSpace: "nowrap",
                marginRight: "4px",
                textAlign: "right",
              }}
              variant="body2"
            >
              {current / 10 + " / " + duration() / 10 + " sec"}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};
