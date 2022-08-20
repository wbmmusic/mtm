import { Box, Button } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { RobotSelector } from "./RobotSelector";

export const Home = () => {
  const navigate = useNavigate();
  return (
    <>
      <Box>
        <Button onClick={() => navigate("/manual")}>Manual</Button>
        <Button onClick={() => navigate("/sequence")}>Sequence</Button>
      </Box>
      <Box>
        <RobotSelector />
      </Box>
    </>
  );
};
