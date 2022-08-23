import {
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Slider from "@mui/material/Slider";
import React, { useState } from "react";

export const Servo = ({ idx, label }) => {
  const [lastSent, setLastSent] = useState(null);
  const [enabled, setEnabled] = useState(false);

  const handleChange = val => {
    if (val !== lastSent) {
      setLastSent(val);
      //console.log("Servo", idx, "->", val);
      window.electron.ipcRenderer
        .invoke("sendValue", [idx, val])
        .then(res => console.log(res))
        .catch(err => console.log(err));
    }
  };

  return (
    <Box component={Paper} p={2} elevation={4}>
      <Stack direction="row">
        <FormControlLabel
          control={
            <Checkbox
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              size="small"
            />
          }
          label={label}
        />
        <Box width={"100%"} />
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          {"Servo " + idx}
        </Typography>
      </Stack>
      <Slider
        disabled={!enabled}
        min={0}
        max={180}
        step={1}
        defaultValue={90}
        valueLabelDisplay="auto"
        onChange={e => handleChange(e.target.value)}
      />
    </Box>
  );
};
