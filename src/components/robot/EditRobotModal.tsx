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
import { saveRobot, safeInvoke } from "../../helpers";
import { modalStyle } from "../../styles";
import { Robot, Servo } from "../../types";
import { v4 as uuid } from "uuid";

const defaultRobot: Robot = {
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

const makeDefaultServo = (index = 0): Servo => ({ id: uuid(), index, name: "", value: 90, enabled: false });

interface EditRobotModalProps {
  mode: "new" | "edit" | null;
  data?: Robot | null;
  out: (arg: "close" | "refresh") => void;
}

export const EditRobotModal: React.FC<EditRobotModalProps> = ({ mode, data, out }) => {
  const makeRobot = (): Robot => {
    if (mode === "edit" && data) return JSON.parse(JSON.stringify(data)) as Robot;
    else return defaultRobot;
  };

  const makeOgRobot = (): Robot | null => {
    if (mode === "edit" && data) return JSON.parse(JSON.stringify(data)) as Robot;
    else return null;
  };

  const [robot, setRobot] = useState<Robot>(makeRobot());
  const [ogRobot] = useState<Robot | null>(makeOgRobot());

  const makeTitle = () => {
    if (mode === "new") return "New Robot";
    else if (mode === "edit") return "Edit Robot";
    return "";
  };

  const saveDisabled = () => {
    return !robot.name || robot.name === "";
  };

  const saveChangesDisabled = () => {
    if (saveDisabled()) return true;
    if (JSON.stringify(robot) === JSON.stringify(ogRobot)) return true;
    return false;
  };

  const updateRobot = () => {
    if (ogRobot?.path !== robot.path) {
      console.log("Paths not equal");
      safeInvoke("updateRobot", robot, ogRobot?.path)
        .then(() => out("refresh"))
        .catch((err) => console.log(err));
    } else {
      safeInvoke("updateRobot", robot)
        .then(() => out("refresh"))
        .catch((err) => console.log(err));
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
        <Button variant="contained" disabled={saveChangesDisabled()} onClick={updateRobot}>
          Save Changes
        </Button>
      );
    }
    return null;
  };

  const deleteServo = (idx: number) => {
    setRobot((old) => ({ ...old, servos: (old.servos || []).filter((_, index) => index !== idx) }));
  };

  const editServoName = (idx: number, newName: string) => {
    const oldServos = JSON.parse(JSON.stringify(robot.servos || [])) as Servo[];
    if (oldServos[idx]) oldServos[idx].name = newName;
    setRobot((old) => ({ ...old, servos: oldServos }));
  };

  useEffect(() => {
    console.log("OPEN");
    return () => {
      console.log("CLOSE");
    };
  }, []);

  return (
    <Modal open={true} onClose={() => out("close")} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
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
            onChange={(e) =>
              setRobot((old: any) => ({
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
            onChange={(e) => setRobot((old: any) => ({ ...old, description: e.target.value }))}
          />
          <TextField label="Assembly video YouTube ID" size="small" variant="standard" value={robot.youtubeId} onChange={(e) => setRobot((old: any) => ({ ...old, youtubeId: e.target.value }))} />
          <Stack direction="row" spacing={1}>
            <Typography variant="body1">Dificulty</Typography>
            <Rating icon={<SmartToyIcon />} emptyIcon={<SmartToyOutlinedIcon />} max={3} value={robot.difficulty} onChange={(e, newVal) => setRobot((old: any) => ({ ...old, difficulty: newVal }))} />
          </Stack>
          <Box component={Paper} p={1}>
            <Typography>Servos</Typography>
            <Stack p={1} spacing={1}>
              {(robot.servos || []).map((servo, idx) => (
                <ServoInput key={"servo" + idx} servo={servo} index={idx} update={(newName: string) => editServoName(idx, newName)} trash={() => deleteServo(idx)} />
              ))}
              <Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    setRobot((old) => ({
                      ...old,
                      servos: [...(old.servos || []), makeDefaultServo((old.servos || []).length)],
                    }))
                  }
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

export default EditRobotModal;
