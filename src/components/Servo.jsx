import { Box, Paper, Stack, Typography } from "@mui/material";
import Slider from "@mui/material/Slider";
import React, { useState } from "react";

export const Servo = ({ idx, label }) => {
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
    <Box component={Paper} m={1} p={2} elevation={6}>
      <Stack direction="row">
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          {"Servo " + idx}
        </Typography>
        <Box width={"100%"} />
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          {"Pin " + label}
        </Typography>
      </Stack>
      <Slider
        min={0}
        max={255}
        step={1}
        defaultValue={127}
        valueLabelDisplay="auto"
        onChange={e => handleChange(e.target.value)}
      />
    </Box>
  );
};
