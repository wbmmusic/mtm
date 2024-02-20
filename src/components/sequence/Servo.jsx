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
const { makeServoPositionData } = window.electron.msgMkr;

export const Servo = ({ label, idx, servo, onChange }) => {
  const [lastSent, setLastSent] = useState(null);

  const handleChange = val => {
    if (val !== lastSent) {
      setLastSent(val);
      //console.log("Servo", idx, "->", val);
      window.electron
        .invoke("sendValue", makeServoPositionData(idx - 1, val))
        .then()
        .catch(err => console.log(err));
    }

    onChange("value", val);
  };

  return (
    <Box component={Paper} p={2} elevation={4}>
      <Stack direction="row">
        <FormControlLabel
          control={
            <Checkbox
              checked={servo.enabled}
              onChange={e => onChange("enabled", e.target.checked)}
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
        value={servo.value}
        disabled={!servo.enabled}
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
