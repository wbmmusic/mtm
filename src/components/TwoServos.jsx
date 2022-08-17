import { Stack } from "@mui/material";
import React from "react";
import { Servo } from "./Servo";

export const TwoServos = () => {
  return (
    <Stack>
      <Servo idx={1} onChange={val => console.log(val)} />
      <Servo idx={2} onChange={val => console.log(val)} />
    </Stack>
  );
};
