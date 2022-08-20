import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

const robots = [
  {
    name: "25 cent high five",
    path: "high25",
    servos: 1,
    description: "Make a coin disappear when your robot gives it high five",
  },
  {
    name: "Rubik's Cube",
    path: "rubiks",
    servos: 2,
    description: "Your robot will solve a rubik's cube in no time",
  },
  { name: "Robot 3", servos: 2, description: "Test Description" },
  { name: "Robot 4", servos: 1, description: "Test Description" },
];

export const RobotSelector = () => {
  const navigate = useNavigate();

  const RobotCard = ({ robot }) => (
    <Box
      p={1}
      component={Paper}
      elevation={2}
      sx={{ cursor: "pointer" }}
      onClick={() => navigate("/robot/" + robot.path)}
    >
      <Stack direction="row" width={"100%"}>
        <Typography variant="h6" sx={{ whiteSpace: "nowrap" }}>
          {robot.name}
        </Typography>
        <Box width={"100%"} />
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          Servos: {robot.servos}
        </Typography>
      </Stack>
      <Divider />
      <Stack direction="row">
        <Box
          component="img"
          sx={{ maxHeight: "100%", maxWidth: "100px" }}
          src="img://robot.png"
        />
        <Box m={1} p={1} width={"100%"} component={Paper}>
          <Typography variant="body2">{robot.description}</Typography>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <Box m={1} p={1} component={Paper} elevation={4}>
      <Box>
        <Typography variant="h5">Robots</Typography>
      </Box>
      <Stack spacing={1}>
        {robots.map(robot => {
          return <RobotCard robot={robot} />;
        })}
      </Stack>
    </Box>
  );
};
