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
import React, { useEffect, useState } from "react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import AddIcon from "@mui/icons-material/Add";
import { ServoInput } from "./ServoInput";
import { saveRobot } from "../../helpers";
import { modalStyle } from "../../styles";

const defaultRobot = {
  name: "",
  path: "",
  readOnly: false,
  description: "",
  youtubeId: "",
  servos: [],
  sequences: [],
  positions: [],
  difficulty: 0,
  boardRequirements: {},
};

const defaultServo = { name: "" };

export const EditRobotModal = ({ mode, data, out }) => {
  const makeRobot = () => {
    if (mode === "edit" && data !== undefined)
      return JSON.parse(JSON.stringify(data));
    else return defaultRobot;
  };

  const makeOgRobot = () => {
    if (mode === "edit" && data !== undefined)
      return JSON.parse(JSON.stringify(data));
    else return null;
  };

  const [robot, setRobot] = useState(makeRobot());
  const [ogRobot, setOgRobot] = useState(makeOgRobot());

  const makeTitle = () => {
    if (mode === "new") return "New Robot";
    else if (mode === "edit") return "Edit Robot";
  };

  const saveDisabled = () => {
    if (robot.name === "") return true;
    return false;
  };

  const saveChangesDisabled = () => {
    if (saveDisabled()) return true;
    if (JSON.stringify(robot) === JSON.stringify(ogRobot)) return true;
    return false;
  };

  const updateRobot = () => {
    if (ogRobot.path !== robot.path) {
      console.log("Paths not equal");
      window.electron
        .invoke("updateRobot", robot, ogRobot.path)
        .then(res => out("refresh"))
        .catch(err => console.log(err));
    } else {
      window.electron
        .invoke("updateRobot", robot)
        .then(res => out("refresh"))
        .catch(err => console.log(err));
    }
  };

  const makeBtns = () => {
    if (mode === "new") {
      return (
        <Button
          variant="contained"
          disabled={saveDisabled()}
          onClick={async () => {
            try {
              await saveRobot(robot);
              out("refresh");
            } catch (error) {
              console.error(error);
            }
          }}
        >
          Save New Robot
        </Button>
      );
    } else if (mode === "edit") {
      return (
        <Button
          variant="contained"
          disabled={saveChangesDisabled()}
          onClick={updateRobot}
        >
          Save Changes
        </Button>
      );
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

  useEffect(() => {
    console.log("OPEN");

    return () => {
      console.log("CLOSE");
    };
  }, []);

  return (
    <Modal
      open={true}
      onClose={() => out("close")}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={{ ...modalStyle, overflowX: "auto" }} maxHeight={"98%"}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          {makeTitle()}
        </Typography>

        <Stack spacing={1}>
          <TextField
            label="Name"
            size="small"
            variant="standard"
            value={robot.name}
            error={robot.name === ""}
            onChange={e =>
              setRobot(old => ({
                ...old,
                name: e.target.value,
                path: e.target.value.replaceAll(" ", "_").toLowerCase(),
              }))
            }
          />
          <TextField
            label="Description"
            size="small"
            variant="standard"
            value={robot.description}
            multiline
            inputProps={{ style: { fontSize: "11px", lineHeight: "170%" } }}
            onChange={e =>
              setRobot(old => ({ ...old, description: e.target.value }))
            }
          />
          <TextField
            label="Assembly video YouTube ID"
            size="small"
            variant="standard"
            value={robot.youtubeId}
            onChange={e =>
              setRobot(old => ({ ...old, youtubeId: e.target.value }))
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
                  variant="contained"
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
            <Button variant="contained" onClick={() => out("close")}>
              Cancel
            </Button>
            {makeBtns()}
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
};
