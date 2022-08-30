import {
  Box,
  Button,
  Modal,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { modalStyle } from "../../styles";
import { Servo } from "./Servo";
import { v4 as uuid } from "uuid";
import { getServos } from "../../helpers";
import { useParams } from "react-router-dom";

const defaultServo = { enabled: false, value: 90 };

export const EditPositionModal = ({ mode, position, out }) => {
  const { robotPath } = useParams();

  const [servos, setServos] = useState(null);

  const makePosition = () => {
    let out = { appId: uuid(), name: "", servos: [] };
    servos.forEach(servo => out.servos.push({ ...defaultServo }));
    return out;
  };

  const [ogPos, setOgPos] = useState(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (position) {
      setOgPos(JSON.parse(JSON.stringify(position)));
      setPos(JSON.parse(JSON.stringify(position)));
    }

    getServos(robotPath)
      .then(res => setServos(res))
      .catch(err => console.error(err));
  }, []);

  // useEffect(() => console.log(pos), [pos]);

  const makeTitle = () => {
    if (mode === "new") return "New";
    if (mode === "edit") return "Edit";
    return "ERROR";
  };

  const isCreatable = () => {
    if (pos.name === "") return false;
    return true;
  };

  const isSavable = () => {
    if (!isCreatable()) return false;
    if (JSON.stringify(ogPos) === JSON.stringify(pos)) return false;
    return true;
  };

  const makeBtn = () => {
    if (mode === "new") {
      return (
        <Button
          size="small"
          disabled={!isCreatable()}
          onClick={() => out("createPosition", pos)}
        >
          Create
        </Button>
      );
    } else if (mode === "edit") {
      return (
        <Button
          size="small"
          disabled={!isSavable()}
          onClick={() => out("updatePosition", pos)}
        >
          Save
        </Button>
      );
    }
  };

  useEffect(() => {
    //setPos(makePosition());
    if (!position && servos) {
      setPos(makePosition());
    }
  }, [servos]);

  if (!pos || !servos) return <div>LOADING</div>;

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
          <TextField
            value={pos.name}
            onChange={e => setPos(old => ({ ...old, name: e.target.value }))}
            variant="standard"
            label="Position Name"
          />
          {pos.servos.map((servo, idx) => (
            <Servo
              key={"servo" + idx}
              label={servos[idx].name}
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
