import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../contexts/GlobalContext";
import AddIcon from "@mui/icons-material/Add";
import { EditRobotModal } from "./robot_modal/EditRobotModal";

const defaultRobots = [
  {
    name: "25 cent high five",
    path: "high25",
    servos: [{ name: "one" }],
    description: "Make a coin disappear when your robot gives it high five",
  },
  {
    name: "Rubik's Cube",
    path: "rubiks",
    servos: [{ name: "one" }, { name: "two" }],
    description: "Your robot will solve a rubik's cube in no time",
  },
];

export const RobotSelector = () => {
  const navigate = useNavigate();
  const { admin } = useContext(GlobalContext);

  const [robotModal, setRobotModal] = useState(null);
  const [robots, setRobots] = useState(defaultRobots);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke("getRobots")
      .then(bots => console.log(bots))
      .catch(err => console.error(err));
  }, []);

  const addRobotBlock = () => (
    <Box>
      <Button startIcon={<AddIcon />} onClick={() => setRobotModal("new")}>
        Create New Robot
      </Button>
    </Box>
  );

  const handleModelOut = data => {
    if (data === "close") setRobotModal(null);
  };

  const makeModal = () => {
    if (robotModal === "new" || robotModal === "edit") {
      return <EditRobotModal newEdit={robotModal} out={handleModelOut} />;
    }
  };

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
          Servos: {robot.servos.length}
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
        {makeModal()}
      </Stack>
    </Box>
  );
};
