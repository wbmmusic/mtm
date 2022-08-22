import {
  Box,
  Button,
  Modal,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import AddIcon from "@mui/icons-material/Add";
import { ServoInput } from "./ServoInput";

const defaultRobot = {
  name: "",
  path: "",
  readOnly: false,
  description: "",
  linkToVideo: "",
  servos: [],
  sequences: [],
  difficulty: 0,
  boardRequirements: {},
};

const defaultServo = { name: "" };

export const EditRobotModal = ({ newEdit, out }) => {
  const [open, setOpen] = useState(true);
  const handleClose = () => setOpen(false);
  const [robot, setRobot] = useState(defaultRobot);

  const makeTitle = () => {
    if (newEdit === "new") return "New Robot";
    else if (newEdit === "edit") return "Edit Robot";
  };

  const saveDisabled = () => {
    if (robot.name === "") return true;
    return false;
  };

  const saveRobot = () => {
    window.electron.ipcRenderer
      .invoke("saveRobot", robot)
      .then(res => out("close"))
      .catch(err => console.log(err));
  };

  const makeBtns = () => {
    if (newEdit === "new") {
      return (
        <Button size="small" disabled={saveDisabled()} onClick={saveRobot}>
          Save New Robot
        </Button>
      );
    } else if (newEdit === "edit") {
      return <Button size="small">Save Changes</Button>;
    }
  };

  const deleteServo = idx => {
    setRobot(old => ({
      ...old,
      servos: old.servos.filter((srv, index) => index !== idx),
    }));
  };

  const editServoName = (idx, newName) => {
    let oldServos = JSON.parse(JSON.stringify(robot.servos));
    oldServos[idx].name = newName;
    setRobot(old => ({
      ...old,
      servos: oldServos,
    }));
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          {makeTitle()}
        </Typography>

        <Stack spacing={1}>
          <TextField
            label="Name"
            size="small"
            variant="standard"
            value={robot.name}
            onChange={e =>
              setRobot(old => ({
                ...old,
                name: e.target.value,
                path: e.target.value.replaceAll(" ", "").toLowerCase(),
              }))
            }
          />
          <TextField
            label="Description"
            size="small"
            variant="standard"
            value={robot.description}
            multiline
            onChange={e =>
              setRobot(old => ({ ...old, description: e.target.value }))
            }
          />
          <TextField
            label="Link To Video"
            size="small"
            variant="standard"
            value={robot.linkToVideo}
            onChange={e =>
              setRobot(old => ({ ...old, linkToVideo: e.target.value }))
            }
          />
          <Stack direction="row" spacing={1}>
            <Typography variant="body1">Dificulty</Typography>
            <Rating
              icon={<SmartToyIcon />}
              emptyIcon={<SmartToyOutlinedIcon />}
              max={3}
              value={robot.difficulty}
              onChange={(e, newVal) =>
                setRobot(old => ({ ...old, difficulty: newVal }))
              }
            />
          </Stack>
          <Box component={Paper} p={1}>
            <Typography>Servos</Typography>
            <Stack p={1} spacing={1}>
              {robot.servos.map((servo, idx) => (
                <ServoInput
                  key={"servo" + idx}
                  servo={servo}
                  index={idx}
                  update={newName => editServoName(idx, newName)}
                  trash={() => deleteServo(idx)}
                />
              ))}
              <Box>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setRobot(old => ({
                      ...old,
                      servos: [...old.servos, defaultServo],
                    }));
                  }}
                >
                  Add Servo
                </Button>
              </Box>
            </Stack>
          </Box>
          <Stack direction="row-reverse" spacing={1}>
            <Button size="small" onClick={() => out("close")}>
              Cancel
            </Button>
            {makeBtns()}
          </Stack>
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
  width: "90%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  maxHeight: "90%",
  overflow: "auto",
};
