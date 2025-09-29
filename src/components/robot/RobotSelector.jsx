import { Box, Button, Modal, Paper, Stack, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../../contexts/GlobalContext";
import AddIcon from "@mui/icons-material/Add";
import { EditRobotModal } from "./EditRobotModal";

import { deleteRobot, getRobots } from "../../helpers";
import { modalStyle } from "../../styles";
import { motion } from "framer-motion";
import { RobotCard } from "./RobotCard";
import { useTypewriter } from "react-simple-typewriter";

const defaultDeleteModal = { show: false, robot: null };
const defaultRobotModal = { mode: null };

export const RobotSelector = () => {
  const { admin } = useContext(GlobalContext);

  const [robotModal, setRobotModal] = useState(defaultRobotModal);
  const [robots, setRobots] = useState([]);
  const [deleteModal, setDeleteModal] = useState(defaultDeleteModal);

  const [text] = useTypewriter({ words: ["Robots"] });

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
            window.electron
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

  const container = {
    show: {
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, scale: 0, rotate: -10 },
    show: { opacity: 1, scale: 1, rotate: 0 },
  };

  return (
    <Box
      m={1}
      p={1}
      component={Paper}
      elevation={4}
      sx={{ backgroundColor: "orange" }}
    >
      <Typography sx={{ opacity: text.length > 0 ? 1 : 0 }} variant="h5">
        {text.length > 0 ? text : "|"}
      </Typography>
      <Stack spacing={1}>
        {admin ? <AddRobotBlock /> : null}
        {robots.length > 0 && (
          <Stack
            spacing={1}
            component={motion.div}
            variants={container}
            initial="hidden"
            animate="show"
          >
            {robots.map((robot, idx) => (
              <motion.div
                key={"robotCard" + robot.name + idx}
                variants={item}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <RobotCard
                  setDelete={e => setDeleteModal(e)}
                  setRobot={e => setRobotModal(e)}
                  robot={robot}
                />
              </motion.div>
            ))}
          </Stack>
        )}
        {makeModal()}
      </Stack>
    </Box>
  );
};
