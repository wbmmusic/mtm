import {
  Box,
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

export const Transport = ({ actions }) => {
  const [current, setCurrent] = useState(0);
  const [intervalId, setIntervalId] = useState(0);
  const [repeat, setRepeat] = useState(false);

  const returnToStart = () => setCurrent(0);

  const makeMarks = () => {
    let out = [];
    let curTime = 0;
    actions.forEach(act => {
      if (act.type === "delay") {
        //out.push({ value: curTime, label: "" });
        curTime = curTime + act.value;
      } else if (act.type === "move") {
        out.push({ value: curTime, label: act.content });
      }
    });
    return out;
  };

  const duration = () => {
    let dur = 0;
    actions.forEach(act => {
      if (act.type === "delay") dur = dur + act.value;
    });
    return dur;
  };

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

  useEffect(() => {
    if (current > duration()) {
      if (repeat) returnToStart();
      else stop();
    }
  }, [current]);

  return (
    <Box>
      <Stack>
        <Box sx={{ padding: "0px 15px" }}>
          <Slider
            marks={makeMarks()}
            value={current}
            min={0}
            step={1}
            max={duration()}
            onChange={e => setCurrent(parseInt(e.target.value))}
          />
        </Box>
        <Divider />
        <Stack direction="row">
          <Tooltip title="Go to start">
            <IconButton
              aria-label="delete"
              size="small"
              onMouseDown={returnToStart}
              color="inherit"
            >
              <SkipPreviousIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Play">
            <IconButton
              aria-label="delete"
              size="small"
              onMouseDown={play}
              color="inherit"
            >
              <PlayArrowIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Stop">
            <IconButton
              aria-label="delete"
              size="small"
              onMouseDown={stop}
              color="inherit"
            >
              <StopIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Repeat">
            <IconButton
              aria-label="delete"
              size="small"
              color={repeat ? "success" : "inherit"}
              onMouseDown={() => setRepeat(prev => !prev)}
            >
              <RepeatIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Box width={"100%"} />
          <Box sx={{ margin: "auto" }}>
            <Typography sx={{ whiteSpace: "nowrap" }} variant="body2">
              {current / 10 + " / " + duration() / 10}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};
