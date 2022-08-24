import React from "react";
import { IconButton, Paper, Stack, TextField, Tooltip } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

export const ServoInput = ({ servo, index, update, trash }) => {
  return (
    <Stack direction="row" spacing={1} component={Paper} p={1}>
      <TextField
        label={`Servo ${index + 1} Name`}
        variant="standard"
        size="small"
        value={servo.name}
        onChange={e => update(e.target.value)}
      />
      <Tooltip placement="left" title="Delete Servo">
        <IconButton color="error" onClick={trash}>
          <ClearIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};
