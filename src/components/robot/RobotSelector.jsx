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
import { GlobalContext } from "../../contexts/GlobalContext";
import AddIcon from "@mui/icons-material/Add";
import { EditRobotModal } from "./EditRobotModal";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { deleteRobot, getRobots } from "../../helpers";
import { modalStyle } from "../../styles";

const defaultDeleteModal = { show: false, robot: null };
const defaultRobotModal = { mode: null };

export const RobotSelector = () => {
  const navigate = useNavigate();
  const { admin } = useContext(GlobalContext);

  const [robotModal, setRobotModal] = useState(defaultRobotModal);
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
    <Stack direction="row" spacing={1}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setRobotModal({ mode: "new" })}
      >
        Create New Robot
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => {
          if (window.confirm("This will wipe all user saved data...")) {
            window.electron.ipcRenderer
              .invoke("deleteUserRobots")
              .then(res => {
                setRobots([]);
                console.log(res);
                setTheRobots();
              })
              .catch(err => console.error(err));
          }
        }}
      >
        Delete User Robots
      </Button>
    </Stack>
  );

  const handleModelOut = data => {
    if (data === "close") setRobotModal(defaultRobotModal);
    else if (data === "refresh") {
      setRobotModal(defaultRobotModal);
      setTheRobots();
    }
  };

  const Buttons = ({ robot }) => (
    <Stack direction="row-reverse" spacing={1}>
      <Button
        variant="contained"
        color="error"
        onClick={() => setDeleteModal({ show: true, robot })}
      >
        Delete
      </Button>
      <Button
        variant="contained"
        onClick={() => setRobotModal({ mode: "edit", robot })}
      >
        Edit
      </Button>
      <Button
        variant="contained"
        onClick={() => {
          window.electron.ipcRenderer
            .invoke("exportRobot", robot.path)
            .then(res => console.log(res))
            .catch(err => console.error(err));
        }}
      >
        Export
      </Button>
    </Stack>
  );

  const RobotCard = ({ robot }) => (
    <Box p={1} component={Paper} elevation={2}>
      <Box
        sx={{ cursor: "pointer" }}
        onClick={() => navigate("/robot/" + robot.path)}
      >
        <Stack direction="row" width={"100%"} spacing={1} alignItems="center">
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
          <Box>
            <Box
              component="img"
              sx={{ maxHeight: "100%", maxWidth: "100px" }}
              src="img://robot.png"
            />
          </Box>
          <Box
            m={1}
            p={1}
            width={"100%"}
            component={Paper}
            color="black"
            sx={{
              backgroundColor: "#BBCC00",
              fontFamily: "Arcade",
              fontSize: "22px",
              lineHeight: "80%",
              border: "5px solid",
              borderRadius: "3px",
            }}
          >
            {robot.description}
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
        <Box sx={modalStyle}>
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
    <Box
      m={1}
      p={1}
      component={Paper}
      elevation={4}
      sx={{ backgroundColor: "orange" }}
    >
      <Typography variant="h5">Robots</Typography>
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
