import { Box, Paper, Typography } from "@mui/material";
import Slider from "@mui/material/Slider";
import React, { useState } from "react";

export const Servo = ({ idx, onChange }) => {
  const [lastSent, setLastSent] = useState(null);

  const handleChange = val => {
    if (val !== lastSent) {
      setLastSent(val);
      console.log("Servo", idx, "->", val);
      window.electron.ipcRenderer
        .invoke("sendValue", idx, val)
        .then(res => console.log(res))
        .catch(err => console.log(err));
    }
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
