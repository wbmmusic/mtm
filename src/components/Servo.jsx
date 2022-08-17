import { Box, Paper, Typography } from "@mui/material";
import Slider from "@mui/material/Slider";
import React from "react";

export const Servo = ({ idx, onChange }) => {
  return (
    <Box component={Paper} maxWidth={400} m={1} p={2} elevation={6}>
      <Slider
        min={0}
        max={255}
        step={1}
        defaultValue={127}
        valueLabelDisplay="auto"
        onChange={e => onChange(e.target.value)}
      />
      <Typography>{"Servo " + idx}</Typography>
    </Box>
  );
};
