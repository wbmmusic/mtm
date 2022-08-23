import {
  Box,
  Button,
  Modal,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Servo } from "./Servo";

const defaultServo = { enabled: false, value: null };

export const EditPositionModal = ({ mode, position, robot, out }) => {
  const [pos, setPos] = useState(null);
  const [ogPos, setOgPos] = useState(null);

  const makeTitle = () => {
    if (mode === "new") return "New";
    if (mode === "edit") return "Edit";
  };

  const isCreatable = () => {
    return false;
  };

  const makeBtn = () => {
    if (mode === "new") {
      return (
        <Button size="small" disabled={isCreatable()}>
          Create
        </Button>
      );
    } else if (mode === "edit") {
      return <Button size="small">Save</Button>;
    }
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
        <Stack spacing={1}>
          <TextField variant="standard" label="Position Name" />
          {robot.servos.map((servo, idx) => (
            <Servo key={"servo" + idx} idx={idx + 1} label={servo.name} />
          ))}
        </Stack>
        <Box p={1} />
        <Stack direction="row-reverse" spacing={1}>
          <Button size="small" onClick={() => out("cancel")}>
            Cancel
          </Button>
          {makeBtn()}
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
