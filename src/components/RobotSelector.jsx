import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../contexts/GlobalContext";
import AddIcon from "@mui/icons-material/Add";

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
];

export const RobotSelector = () => {
  const navigate = useNavigate();
  const { admin } = useContext(GlobalContext);

  const addRobotBlock = () => (
    <Box>
      <Button
        startIcon={<AddIcon />}
        variant="contained"
        onClick={() => console.log("Create New Robot")}
      >
        Create New Robot
      </Button>
    </Box>
  );

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
        {admin ? addRobotBlock() : null}
        {robots.map((robot, idx) => {
          return <RobotCard key={"robotCard" + idx} robot={robot} />;
        })}
      </Stack>
    </Box>
  );
};
