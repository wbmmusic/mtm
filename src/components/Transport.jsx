import { Box, Button, IconButton, Paper, Stack } from "@mui/material";
import React from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import RepeatIcon from "@mui/icons-material/Repeat";

export const Transport = () => {
  return (
    <Box component={Paper}>
      <Stack direction="row">
        <IconButton aria-label="delete" size="small">
          <SkipPreviousIcon fontSize="inherit" />
        </IconButton>
        <IconButton aria-label="delete" size="small">
          <PlayArrowIcon fontSize="inherit" />
        </IconButton>
        <IconButton aria-label="delete" size="small">
          <StopIcon fontSize="inherit" />
        </IconButton>
        <IconButton aria-label="delete" size="small">
          <RepeatIcon fontSize="inherit" />
        </IconButton>
        <Button size="small">save</Button>
        <Button size="small">open</Button>
      </Stack>
    </Box>
  );
};
