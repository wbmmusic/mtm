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
import React, { useEffect, useState } from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import RepeatIcon from "@mui/icons-material/Repeat";
import { useContext } from "react";
import { GlobalContext } from "../../contexts/GlobalContext";

export const Transport = ({ actions }) => {
  const { usbConnected } = useContext(GlobalContext);
  const { makeServoPositionData, makeWaitData, waitTypes } =
    window.electron.msgMkr;
  // console.log(actions);
  const makeMarks = () => {
    let out = [];
    let curTime = 0;

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Need to handle two of same position at same time...
    // perhaps double name and remove one..
    // Causes not unique key error from slider

    actions.forEach(act => {
      if (act.type === "delay") {
        //out.push({ value: curTime, label: "" });
        curTime = curTime + act.value;
      } else if (act.type === "move") {
        out.push({ value: curTime, label: null, servos: act.servos });
        // out.push({ value: curTime, label: act.content, servos: act.servos });
      } else if (act.type === "wait") {
        out.push({ value: curTime, label: "wait", key: act.key });
      }
    });
    return out;
  };

  const [current, setCurrent] = useState(0);
  const [intervalId, setIntervalId] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [marks, setMarks] = useState(makeMarks());
  const [waitingOnKey, setWaitingOnKey] = useState(null);

  const returnToStart = () => setCurrent(0);

  const duration = () => {
    let dur = 0;
    actions.forEach(act => {
      if (act.type === "delay") dur = dur + act.value;
    });
    return dur;
  };

  //console.log(actions);

  const stop = () => {
    clearInterval(intervalId);
    setIntervalId(0);
  };

  const play = () => {
    if (intervalId) {
      stop();
      return;
    }
    const newIntervalId = setInterval(() => setCurrent(prev => prev + 1), 100);
    setIntervalId(newIntervalId);
  };

  const waitOnKey = key => {};

  const makeServoPacket = (servoNumber, position) => {
    let out = [];
    out.push(servoNumber);
    out.push(position);
    return out;
  };

  useEffect(() => {
    marks.forEach(mark => {
      if (mark.value === current) {
        let packet = [];
        if (mark.servos !== undefined) {
          mark.servos.forEach((servo, idx) => {
            if (servo.enabled) {
              console.log("YEAH");
              packet.push(...makeServoPositionData(idx, servo.value));
              //packet.push(...makeServoPacket(idx, servo.value));
            }
          });
        } else if (mark.key !== undefined) {
          // This is a wait state
          console.log("Waiting on key", mark.key);

          packet.push(...makeWaitData(waitTypes.remote, 1));
          //waitOnKey(mark.key);
        }
        if (packet.length > 0) {
          window.electron.ipcRenderer
            .invoke("sendValue", packet)
            .then()
            .catch(err => console.log(err));
        }
      }
    });

    if (current > duration()) {
      if (repeat) returnToStart();
      else stop();
    }
  }, [current]);

  useEffect(() => {
    setMarks(makeMarks());
    // console.log("Make Marks");
  }, [actions]);

  useEffect(() => {
    if (waitingOnKey) {
      window.electron.receive("keyPress", key => {
        // If the key that was pressed is the key we were waiting for
        if (key === waitingOnKey) {
          //resume playback

          // No longer waiting for a key press
          setWaitingOnKey(null);
        }
      });
    }

    return () => {
      window.electron.removeListener("keyPress");
    };
  }, [waitingOnKey]);

  const handleUpload = () => {
    console.log("Upload");
    window.electron.send("upload", actions);
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
            onChange={e => setCurrent(parseInt(e.target.value))}
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
                onMouseDown={() => setRepeat(prev => !prev)}
              >
                <RepeatIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack>
            <Button
              sx={{ margin: "auto" }}
              variant="contained"
              onClick={handleUpload}
              disabled={!uploadable()}
            >
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
