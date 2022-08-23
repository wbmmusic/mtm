import {
  Box,
  Button,
  Divider,
  Modal,
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
import { deleteRobot, getRobots } from "../helpers";

const defaultDeleteModal = { show: false, robot: null };

export const RobotSelector = () => {
  const navigate = useNavigate();
  const { admin } = useContext(GlobalContext);

  const [robotModal, setRobotModal] = useState({ mode: null });
  const [robots, setRobots] = useState([]);
  const [deleteModal, setDeleteModal] = useState(defaultDeleteModal);

  const setTheRobots = async () => {
    try {
      const robots = await getRobots();
      setRobots(robots);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setTheRobots();
  }, []);

  const deleteBot = async path => {
    try {
      const robots = await deleteRobot(path);
      setRobots(robots);
      closeDeleteModal();
    } catch (error) {
      console.error(error);
    }
  };

  const AddRobotBlock = () => (
    <Box>
      <Button
        startIcon={<AddIcon />}
        onClick={() => setRobotModal({ mode: "new" })}
      >
        Create New Robot
      </Button>
    </Box>
  );

  const handleModelOut = data => {
    if (data === "close") setRobotModal({ mode: null });
    else if (data === "refresh") {
      setTheRobots();
      setRobotModal({ mode: null });
    }
  };

  const Buttons = ({ robot }) => (
    <Stack direction="row-reverse">
      <Button
        color="error"
        size="small"
        onClick={() => setDeleteModal({ show: true, robot })}
      >
        Delete
      </Button>
      <Button
        size="small"
        onClick={() => setRobotModal({ mode: "edit", robot })}
      >
        Edit
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
      {admin ? <Buttons robot={robot} /> : null}
    </Box>
  );

  const closeDeleteModal = () => setDeleteModal(defaultDeleteModal);

  const DeleteModal = () => {
    return (
      <Modal
        open={deleteModal.show}
        onClose={closeDeleteModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Confirm Delete Robot
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Are you sure you want to delete robot named{" "}
            <b>{deleteModal.robot.name}</b>
          </Typography>
          <Stack direction="row-reverse" spacing={1}>
            <Button
              size="small"
              color="error"
              onClick={() => deleteBot(deleteModal.robot.path)}
            >
              Delete
            </Button>
            <Button
              size="small"
              color="success"
              onClick={() => setDeleteModal(defaultDeleteModal)}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </Modal>
    );
  };

  const makeModal = () => {
    if (robotModal.mode === "new" || robotModal.mode === "edit") {
      return (
        <EditRobotModal
          mode={robotModal.mode}
          data={robotModal.robot}
          out={handleModelOut}
        />
      );
    } else if (deleteModal.show) {
      return <DeleteModal robot={deleteModal.robot} />;
    }
  };

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

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};
