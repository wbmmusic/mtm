import {
  Box,
  Button,
  Modal,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { modalStyle } from "../../styles";
import { Servo } from "./Servo";

const defaultServo = { enabled: false, value: null };
const defaultPosition = { name: "", servos: [] };

export const EditPositionModal = ({ mode, position, robot, out }) => {
  const makePosition = () => {
    let out = {
      name: "",
      servos: [],
    };

    robot.servos.forEach(servo =>
      out.servos.push({ ...servo, ...defaultServo })
    );

    return out;
  };
  const [pos, setPos] = useState(makePosition());
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
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          {`${makeTitle()} Position`}
        </Typography>
        <Stack spacing={1}>
          <TextField variant="standard" label="Position Name" />
          {pos.servos.map((servo, idx) => (
            <Servo
              key={"servo" + idx}
              label={servo.name}
              idx={idx + 1}
              servo={servo}
              onChange={(type, val) => {
                let tempPos = JSON.parse(JSON.stringify(pos));
                if (type === "value") {
                  tempPos.servos[idx].value = val;
                } else if (type === "enabled") {
                  tempPos.servos[idx].enabled = val;
                }
                setPos(tempPos);
              }}
            />
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
