import { Box, Modal, Stack, Typography } from "@mui/material";
import React, { useState } from "react";

export const EditPositionModal = ({ mode, position, robot, out }) => {
  const [pos, setPos] = useState(null);
  const [ogPos, setOgPos] = useState(null);

  const makeTitle = () => {
    if (mode === "new") return "New";
    if (mode === "edit") return "Edit";
  };

  return (
    <Modal
      open={true}
      onClose={() => out("cancel")}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          {`${makeTitle()} Position`}
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
        </Typography>
        <Stack>
          {robot.servos.map((servo, idx) => (
            <Box key={"servo" + idx}>
              <Typography>{servo.name}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Modal>
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
