import { Box, Stack } from "@mui/material";
import React from "react";
import { Servo } from "./Servo";

export const TwoServos = () => {
  return (
    <Box height={"100%"} sx={{ overflow: "auto" }}>
      <Stack>
        <Servo idx={1} label="D3" />
        <Servo idx={2} label="D5" />
        {/* <Servo idx={3} label="D6" />
        <Servo idx={4} label="D9" />
        <Servo idx={5} label="D10" />
        <Servo idx={6} label="D11" /> */}
      </Stack>
    </Box>
  );
};
