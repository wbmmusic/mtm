import {
  Box,
  Button,
  Modal,
  Stack,
  TextField,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import React, { useEffect, useState, useCallback } from "react";
import { modalStyle } from "../../styles";
import { v4 as uuid } from "uuid";
import { getServos } from "../../helpers";
import { useParams } from "react-router-dom";
import type { Servo, Position as PositionType } from "../../types";

const defaultServo = (index = 0): Servo => ({ id: uuid(), index, value: 90, enabled: false });

export const EditPositionModal: React.FC<{ mode: "new" | "edit"; position?: PositionType | null; out: (t: "cancel" | "createPosition" | "updatePosition", d?: PositionType | undefined) => void }> = ({ mode, position, out }) => {
  const { robotPath } = useParams();

  const [servos, setServos] = useState<Servo[] | null>(null);
  const makePosition = useCallback((): PositionType => {
    const o: PositionType = { appId: uuid(), name: "", servos: [] };
    servos?.forEach((_, i) => o.servos.push(defaultServo(i)));
    return o;
  }, [servos]);

  const [ogPos, setOgPos] = useState<PositionType | null>(null);
  const [pos, setPos] = useState<PositionType | null>(null);

  useEffect(() => {
    if (position) {
      setOgPos(JSON.parse(JSON.stringify(position)) as PositionType);
      setPos(JSON.parse(JSON.stringify(position)) as PositionType);
    }

    getServos(robotPath as string)
      .then((res: Servo[]) => setServos(res))
      .catch((err: unknown) => console.error(err));
  }, [position, robotPath]);

  const makeTitle = () => {
    if (mode === "new") return "New";
    if (mode === "edit") return "Edit";
    return "ERROR";
  };

  const isCreatable = () => {
    if (pos && pos.name === "") return false;
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
        <Button variant="contained" disabled={!isCreatable()} onClick={() => out("createPosition", pos ?? undefined)}>
          Create
        </Button>
      );
    } else if (mode === "edit") {
      return (
        <Button variant="contained" disabled={!isSavable()} onClick={() => out("updatePosition", pos ?? undefined)}>
          Save
        </Button>
      );
    }
    return null;
  };

  useEffect(() => {
    if (!position && servos) {
      setPos(makePosition());
    }
  }, [servos, position, makePosition]);

  if (!pos || !servos) return <div>LOADING</div>;

  return (
    <Modal open={true} onClose={() => out("cancel")} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          {`${makeTitle()} Position`}
        </Typography>
        <Stack spacing={1}>
          <TextField value={pos.name} onChange={(e) => setPos((old) => (old ? { ...old, name: e.target.value } : old))} variant="standard" label="Position Name" error={pos.name === ""} />
          {pos.servos.map((servo: Servo, idx: number) => (
            <Box key={idx} sx={{ display: "flex", gap: 1 }}>
              <TextField
                value={servo.name ?? ""}
                onChange={(e) =>
                  setPos((old) =>
                    old
                      ? { ...old, servos: old.servos.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s)) }
                      : old
                  )
                }
                variant="standard"
                label="Servo Name"
              />
              <TextField
                value={servo.index ?? ""}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value);
                  setPos((old) =>
                    old
                      ? {
                          ...old,
                          servos: old.servos.map((s, i) =>
                            i === idx ? { ...s, index: Number.isNaN(parsed) ? s.index ?? 0 : parsed } : s
                          ),
                        }
                      : old
                  );
                }}
                variant="standard"
                label="Servo Index"
              />
              <Select
                value={servo.type ?? ""}
                onChange={(e) =>
                  setPos((old) =>
                    old
                      ? { ...old, servos: old.servos.map((s, i) => (i === idx ? { ...s, type: e.target.value as string } : s)) }
                      : old
                  )
                }
              >
                <MenuItem value={"servo"}>Servo</MenuItem>
                <MenuItem value={"led"}>LED</MenuItem>
              </Select>
            </Box>
          ))}
        </Stack>
        <Box p={1} />
        <Stack direction="row-reverse" spacing={1}>
          <Button variant="contained" onClick={() => out("cancel")}>
            Cancel
          </Button>
          {makeBtn()}
        </Stack>
      </Box>
    </Modal>
  );
};
