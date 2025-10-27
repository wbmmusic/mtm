import { Box, Button, Modal, Paper, Stack, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../../contexts/GlobalContext";
import AddIcon from "@mui/icons-material/Add";
import { EditRobotModal } from "./EditRobotModal";
import { RetroConfirmModal } from "../styled";

import { deleteRobot, getRobots, safeInvoke } from "../../helpers";
import { modalStyle } from "../../styles";
import { motion } from "framer-motion";
import { RobotCard } from "./RobotCard";
import { useTypewriter } from "react-simple-typewriter";
import { Robot } from "../../types";

type DeleteModalState = { show: boolean; robot?: Robot | null };
type RobotModalState = { mode: "new" | "edit" | null; robot?: Robot | null };

const defaultDeleteModal: DeleteModalState = { show: false, robot: null };
const defaultRobotModal: RobotModalState = { mode: null };

export const RobotSelector: React.FC = () => {
  const { admin } = useContext(GlobalContext) as { admin?: boolean };

  const [robotModal, setRobotModal] =
    useState<RobotModalState>(defaultRobotModal);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [deleteModal, setDeleteModal] =
    useState<DeleteModalState>(defaultDeleteModal);
  const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);

  const [text] = useTypewriter({ words: ["Robots"] });

  const setTheRobots = async () => {
    try {
      const r = await getRobots();
      setRobots(r ?? []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setTheRobots();
  }, []);

  const deleteBot = async (path: string) => {
    try {
      const robots = await deleteRobot(path);
      setRobots(robots);
      closeDeleteModal();
    } catch (error) {
      console.error(error);
    }
  };

  const AddRobotBlock: React.FC = () => (
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
        onClick={() => setShowFactoryResetConfirm(true)}
      >
        Delete User Robots
      </Button>
    </Stack>
  );

  const handleModelOut = (data: "close" | "refresh") => {
    if (data === "close") setRobotModal(defaultRobotModal);
    else if (data === "refresh") {
      setRobotModal(defaultRobotModal);
      setTheRobots();
    }
  };

  const closeDeleteModal = () => setDeleteModal(defaultDeleteModal);

  const handleFactoryResetConfirm = () => {
    safeInvoke("deleteUserRobots")
      .then(() => {
        setRobots([]);
        setTheRobots();
        setShowFactoryResetConfirm(false);
      })
      .catch(err => console.error(err));
  };

  const handleFactoryResetCancel = () => {
    setShowFactoryResetConfirm(false);
  };

  const DeleteModal: React.FC = () => {
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
            <b>{deleteModal.robot?.name}</b>
          </Typography>
          <Stack direction="row-reverse" spacing={1}>
            <Button
              size="small"
              color="error"
              onClick={() => deleteBot(deleteModal.robot?.path ?? "")}
              disabled={!deleteModal.robot?.path}
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
    return (
      <>
        {robotModal.mode === "new" || robotModal.mode === "edit" ? (
          <EditRobotModal
            mode={robotModal.mode}
            data={robotModal.robot ?? null}
            out={handleModelOut}
          />
        ) : null}
        {deleteModal.show ? <DeleteModal /> : null}
        <RetroConfirmModal
          open={showFactoryResetConfirm}
          title="Factory Reset"
          message="This will permanently delete all user saved data including robots, positions, and sequences. This action cannot be undone!"
          confirmText="Delete All"
          cancelText="Cancel"
          onConfirm={handleFactoryResetConfirm}
          onCancel={handleFactoryResetCancel}
          danger={true}
        />
      </>
    );
  };

  const container = { show: { transition: { staggerChildren: 0.03 } } };
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
                key={"robotCard" + (robot.name ?? "") + idx}
                variants={item}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <RobotCard
                  setDelete={(e: DeleteModalState) => setDeleteModal(e)}
                  setRobot={(e: RobotModalState) => setRobotModal(e)}
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

export default RobotSelector;
