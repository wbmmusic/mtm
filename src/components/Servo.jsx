import { Box, Paper, Typography } from "@mui/material";
import Slider from "@mui/material/Slider";
import React from "react";

export const Servo = ({ idx, onChange }) => {
  const handleChange = val => {
    console.log(val);
    window.electron.ipcRenderer
      .invoke("sendValue", idx, val)
      .then(res => console.log(res))
      .catch(err => console.log(err));
  };
  return (
    <Box component={Paper} maxWidth={400} m={1} p={2} elevation={6}>
      <Slider
        min={0}
        max={255}
        step={1}
        defaultValue={127}
        valueLabelDisplay="auto"
        onChange={e => handleChange(e.target.value)}
      />
      <Typography>{"Servo " + idx}</Typography>
    </Box>
  );
};
