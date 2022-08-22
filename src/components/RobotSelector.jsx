import {
  Box,
  Button,
  Divider,
  Paper,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../contexts/GlobalContext";
import AddIcon from "@mui/icons-material/Add";
import { EditRobotModal } from "./robot_modal/EditRobotModal";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";

export const RobotSelector = () => {
  const navigate = useNavigate();
  const { admin } = useContext(GlobalContext);

  const [robotModal, setRobotModal] = useState(null);
  const [robots, setRobots] = useState([]);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke("getRobots")
      .then(bots => setRobots(bots))
      .catch(err => console.error(err));
  }, []);

  const deleteBot = path => {
    console.log("delete", path);
  };

  const AddRobotBlock = () => (
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

  const DeleteBot = ({ path }) => (
    <Stack direction="row-reverse">
      <Button color="error" size="small" onClick={() => deleteBot(path)}>
        Delete
      </Button>
    </Stack>
  );

  const RobotCard = ({ robot }) => (
    <Box p={1} component={Paper} elevation={2}>
      <Box
        sx={{ cursor: "pointer" }}
        onClick={() => navigate("/robot/" + robot.path)}
      >
        <Stack direction="row" width={"100%"} spacing={1}>
          <Typography variant="h6" sx={{ whiteSpace: "nowrap" }}>
            {robot.name}
          </Typography>
          <Box width={"100%"} />
          <Rating
            icon={<SmartToyIcon />}
            emptyIcon={<SmartToyOutlinedIcon />}
            max={3}
            value={robot.difficulty}
            readOnly
          />
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
      {admin ? <DeleteBot path={robot.path} /> : null}
    </Box>
  );

  return (
    <Box m={1} p={1} component={Paper} elevation={4}>
      <Box>
        <Typography variant="h5">Robots</Typography>
      </Box>
      <Stack spacing={1}>
        {admin ? <AddRobotBlock /> : null}
        {robots.map((robot, idx) => {
          return <RobotCard key={"robotCard" + idx} robot={robot} />;
        })}
        {makeModal()}
      </Stack>
    </Box>
  );
};
