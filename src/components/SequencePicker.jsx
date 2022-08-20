import { Box, Paper, Typography } from "@mui/material";
import React from "react";

export const SequencePicker = () => {
  return (
    <Box p={1} component={Paper}>
      <Typography>Sequence Picker</Typography>
      <Typography>
        Here is where we display the already existing sequences and give the
        ability to reate a custom sequence
      </Typography>
    </Box>
  );
};
