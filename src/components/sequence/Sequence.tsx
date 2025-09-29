import React, { useEffect, useState, useCallback } from "react";
import { safeSend } from "../../helpers";
import Box from "@mui/material/Box";
import {
  Stack,
  Paper,
  Typography,
  TextField,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { Transport } from "./Transport";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { useNavigate, useParams } from "react-router-dom";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import SettingsRemoteIcon from "@mui/icons-material/SettingsRemote";
import { EditPositionModal } from "./EditPositionModal";
import { v4 as uuid } from "uuid";
import {
  createPosition,
  deletePosition,
  deleteSequence,
  getPositions,
  getSequence,
  saveSequence,
  updatePosition,
  updateSequence,
} from "../../helpers";
import EditIcon from "@mui/icons-material/Edit";
import ControlPointDuplicateIcon from "@mui/icons-material/ControlPointDuplicate";
import { SelectPositionModal } from "./SelectPositionModal";
import { ConfirmDeletePositionModal } from "./ConfirmDeletePositionModal";
import { delays, waitStates } from "./Constants";
import { Position as PositionType, Sequence as SequenceType, Servo as ServoType, Action } from "../../types";
import { ConfirmDeleteSequenceModal } from "./ConfirmDeleteSequenceModal";

type PositionModalState = { show: boolean; mode: "new" | "edit" | null; position: PositionType | null };
type SelectPositionModalState = { show: boolean };
type DeletePositionModalState = { show: boolean; position: PositionType | null };
type ConfirmDeleteSequenceModalState = { show: boolean; name: string | null };
type TimelineItem = { id: string; appId?: string; content?: string; type?: string; servos?: ServoType[]; value?: number; name?: string };

const defaultPositionModal: PositionModalState = { show: false, mode: null, position: null };
const defaultSelectPositionModal: SelectPositionModalState = { show: false };
const defaultDeletePositionModal: DeletePositionModalState = { show: false, position: null };
const defaultSequence: SequenceType = { appId: uuid(), name: "", actions: [] } as SequenceType;
const defaultConfirmDeleteSequenceModal: ConfirmDeleteSequenceModalState = { show: false, name: null };

const droppableStyle = {
  border: "6px solid #55533c",
  borderLeft: "20px solid #55533c",
  borderRight: "20px solid #55533c",
  minHeight: "80px",
  backgroundColor: "lightGrey",
  boxShadow: "2px 2px magenta, 6px 6px black",
};

export const Sequence: React.FC = () => {
  const navigate = useNavigate();
  const { robotPath, sequenceId } = useParams();

  const [confirmDeleteSequenceModal, setConfirmDeleteSequenceModal] = useState<ConfirmDeleteSequenceModalState>(
    defaultConfirmDeleteSequenceModal
  );
  const [timelineObjects, setTimelineObjects] = useState<TimelineItem[] | null>(null);
  const [positions, setPositions] = useState<PositionType[] | null>(null);
  const [positionModal, setPositionModal] = useState<PositionModalState>(defaultPositionModal);
  const [ogSequense, setOgSequense] = useState<SequenceType | null>(null);
  const [deletePositionModal, setDeletePositionModal] = useState<DeletePositionModalState>(
    defaultDeletePositionModal
  );
  const [selectPositionModal, setSelectPositionModal] = useState<SelectPositionModalState>(
    defaultSelectPositionModal
  );
  const [modalPositions, setModalPositions] = useState<PositionType[] | null>(null);

  const initSequence = () => {
    if (sequenceId === "newsequenceplaceholder") return defaultSequence;
    else return null;
  };

  const [sequence, setSequence] = useState<SequenceType | null>(initSequence());

  const setTheSequences = (seq: SequenceType) => {
    setSequence(JSON.parse(JSON.stringify(seq)) as SequenceType);
    setOgSequense(JSON.parse(JSON.stringify(seq)) as SequenceType);
  };

  const makeObjects = useCallback(() => {
    const out: TimelineItem[] = [...delays, ...waitStates] as TimelineItem[];
    if (positions) {
      positions.forEach((position) => {
        out.push({ id: uuid(), appId: position.appId, content: position.name, type: "move", servos: position.servos });
      });
    }

    setTimelineObjects(out);
  }, [positions]);

  const loadSequence = useCallback(() => {
    getSequence(robotPath as string, sequenceId as string)
      .then((res: SequenceType) => {
        const tempSeq = JSON.parse(JSON.stringify(res)) as SequenceType;
        tempSeq.actions = (tempSeq.actions || []).map((act) => ({ ...(act as Action), id: uuid() } as Action));
        setTheSequences(tempSeq);
      })
      .catch((err: unknown) => console.log(err));
  }, [robotPath, sequenceId]);

  useEffect(() => {
    // play a sound and load positions when the robotPath changes.
    // Do not call `makeObjects()` here or depend on it: `makeObjects` is
    // memoized and recreates whenever `positions` changes which can cause
    // a render loop (positions -> makeObjects -> effect -> setPositions -> ...).
    safeSend("play", "sequence.mp3");
    getPositions(robotPath as string)
      .then((res: PositionType[]) => setPositions(res))
      .catch((err: unknown) => console.error(err));
  }, [robotPath]);

  useEffect(() => {
    if (sequenceId !== "newsequenceplaceholder") loadSequence();
  }, [sequenceId, loadSequence]);

  useEffect(() => makeObjects(), [makeObjects]);

  const haveEverything = () => {
    if (!sequence) return false;
    const acts = (sequence.actions || []) as Action[];
    for (const act of acts) {
      if (act.type === "move") {
        const idx = timelineObjects?.findIndex((obj) => obj.appId === act.appId) ?? -1;
        if (idx < 0) return false;
      }
    }
    return true;
  };

  if (!positions || !sequence || !timelineObjects || !haveEverything()) {
    return <></>;
  }

  const makeOutput = () => {
    const tempSeq = JSON.parse(JSON.stringify(sequence)) as SequenceType;
    (tempSeq.actions || []).forEach((act) => {
      delete (act as any).type;
      delete (act as any).id;
    });
    return tempSeq;
  };

  const sequenceSave = () => {
    if (!sequence) return;
    if (sequenceId !== "newsequenceplaceholder") {
      updateSequence(robotPath as string, makeOutput())
        .then(() => loadSequence())
        .catch((err: unknown) => console.log(err));
    } else {
      saveSequence(robotPath as string, makeOutput())
        .then(() => navigate(`/sequence/${robotPath}/${sequence.appId}`))
        .catch((err: unknown) => console.log(err));
    }
  };

  const sequenceDelete = () => {
    deleteSequence(robotPath as string, makeOutput())
      .then(() => navigate("/robot/" + robotPath))
      .catch((err: unknown) => console.log(err));
  };

  const DelayItem: React.FC<{ itm: TimelineItem }> = ({ itm }) => (
    <Stack height={"100%"}>
      <Box>
        <Typography variant="body2" sx={{ textAlign: "center", whiteSpace: "nowrap", fontSize: "9px" }}>
          {itm.content}
        </Typography>
      </Box>
      <Box height={"100%"}>
  <Box m={"auto"} height={"100%"} width={`${(itm.value ?? 0) / 2}px`} sx={{ backgroundColor: "lightGrey" }} />
      </Box>
    </Stack>
  );

  const WaitItem: React.FC<{ itm: TimelineItem }> = ({ itm }) => (
    <Stack height={"100%"}>
      <Box>
        <Typography variant="body2" sx={{ textAlign: "center", whiteSpace: "nowrap", fontSize: "9px" }}>
          {itm.content}
        </Typography>
      </Box>
      <Box height={"100%"}>
        <Stack height="100%" justifyContent="center">
          <SettingsRemoteIcon />
        </Stack>
      </Box>
    </Stack>
  );

  const PositionItem: React.FC<{ itm: TimelineItem }> = ({ itm }) => (
    <Box height={"100%"}>
      <Typography sx={{ fontSize: "9px" }} variant="body2">
        {itm.content}
      </Typography>
      <Stack spacing={0.5}>
        {itm.servos?.map((servo: ServoType, idx: number) => (
          <LinearProgress key={"servo" + idx + itm.name} color={servo.enabled ? "primary" : "inherit"} variant="determinate" value={((servo.value ?? 0) * 100) / 180} />
        ))}
      </Stack>
    </Box>
  );

  const onDragEnd = (res: DropResult) => {
    if (!res.destination) {
      return;
    }
    if (res.source.droppableId === "objects" && res.destination.droppableId === "timeline") {
      const objCpy = JSON.parse(JSON.stringify(timelineObjects![res.source.index]));
      safeSend("play", "timeline_add.mp3");
      const actionsCopy = JSON.parse(JSON.stringify(sequence?.actions || [])) as Action[];
      const insert: Action = { type: objCpy.type as Action["type"], appId: objCpy.appId, id: uuid() } as Action;
      actionsCopy.splice(res.destination.index, 0, insert);

      setSequence((old: SequenceType | null) => (old ? { ...old, actions: actionsCopy } : old));
    } else if (res.source.droppableId === "timeline" && res.destination.droppableId === "timeline") {
      safeSend("play", "timeline_move.mp3");
      const actionsCpy = JSON.parse(JSON.stringify(sequence?.actions || [])) as Action[];
      const cutAction = actionsCpy.splice(res.source.index, 1)[0];
      actionsCpy.splice(res.destination.index, 0, cutAction);
      setSequence((old: SequenceType | null) => (old ? { ...old, actions: actionsCpy } : old));
    }
  };

  const makeItem = (itm: TimelineItem) => {
    if (itm.type === "delay") return <DelayItem itm={itm} />;
    else if (itm.type === "move") return <PositionItem itm={itm} />;
    else if (itm.type === "wait") return <WaitItem itm={itm} />;
    return null;
  };

  const makeDefaultPosition = () => {
    return null;
  };

  const handlePositionModal = (type: "cancel" | "createPosition" | "updatePosition", data?: PositionType | undefined) => {
    if (type === "cancel") setPositionModal(defaultPositionModal);
    else if (type === "createPosition") {
      setPositionModal(defaultPositionModal);
      if (!data) return;
      createPosition(robotPath as string, data)
        .then((res: PositionType[]) => setPositions(res))
        .catch((err: unknown) => console.log(err));
    } else if (type === "updatePosition") {
      setPositionModal(defaultPositionModal);
      if (!data) return;
      updatePosition(robotPath as string, data)
        .then((res: PositionType[]) => setPositions(res))
        .catch((err: unknown) => console.log(err));
    }
  };

  const TimelineObjects: React.FC = () => {
    return (
      <Box p={1} sx={{ border: "3px dashed limegreen" }}>
        <Box>
          <Box sx={{ paddingLeft: "4px" }}>
            <Typography variant="h6">ACTIONS</Typography>
          </Box>
          <Droppable droppableId="objects" direction="horizontal" isDropDisabled={true}>
            {(provided) => (
              <Stack component={Paper} ref={provided.innerRef} {...provided.droppableProps} direction={"row"} p={0.5} width={"100%"} spacing={0.5} sx={droppableStyle}>
                {timelineObjects?.map((itm: TimelineItem, idx: number) => (
                  <Draggable key={"timelineitm" + itm.id} draggableId={itm.id} index={idx}>
                    {(provided, snapshot) => (
                      <>
                        <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} component={Paper} p={0.5}>
                          {makeItem(itm)}
                        </Box>
                        {snapshot.isDragging && (
                          <Box component={Paper} p={0.5}>
                            {makeItem(itm)}
                          </Box>
                        )}
                      </>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Stack>
            )}
          </Droppable>
        </Box>
      </Box>
    );
  };

  const Timeline: React.FC = () => {
    return (
      <Box p={1} sx={{ border: "3px dashed limegreen" }}>
        <Box width={"100%"}>
          <Box sx={{ paddingLeft: "4px" }}>
            <Stack direction="row" spacing={4}>
              <Typography variant="h6">MY SEQUENCE</Typography>
              {(sequence?.actions?.length || 0) > 0 ? (
                <Button color="error" size="small" onClick={() => {
                  if (window.confirm("Are you sure you want to clear the timeline?")) {
                    setSequence((old) => (old ? { ...old, actions: [] } : old));
                  }
                }}>
                  Clear Timeline
                </Button>
              ) : null}
            </Stack>
          </Box>
          <Droppable droppableId="timeline" direction="horizontal">
            {(provided) => (
              <Stack component={Paper} ref={provided.innerRef} {...provided.droppableProps} direction={"row"} p={1} width={"100%"} spacing={0.5} sx={droppableStyle}>
        {((sequence?.actions || []) as Action[]).map((a, idx: number) => {
          const found = a.appId ? timelineObjects?.find((obj: TimelineItem) => obj.appId === a.appId) ?? null : null;
          // If we couldn't find the referenced object, render a placeholder
          const itm = found
            ? (JSON.parse(JSON.stringify(found)) as TimelineItem)
            : { id: `missing-${a.appId ?? idx}`, content: "MISSING", type: "move", servos: [], appId: a.appId } as TimelineItem;
          itm.id = a.id ?? itm.id;
          return (
            <Draggable key={"timelineItm" + itm.id} draggableId={itm.id} index={idx}>
              {(provided2) => (
                <Box component={Paper} ref={provided2.innerRef} {...provided2.draggableProps} {...provided2.dragHandleProps} p={0.5}>
                  {makeItem(itm)}
                </Box>
              )}
            </Draggable>
          );
        })}
                {provided.placeholder}
              </Stack>
            )}
          </Droppable>
        </Box>
      </Box>
    );
  };

  const isSavable = () => {
    if (sequence.name === "") return false;
    if (sequenceId !== "newsequenceplaceholder") {
      if (JSON.stringify(sequence) === JSON.stringify(ogSequense)) {
        return false;
      }
    }
    return true;
  };

  const handleSelectPosition = async (type: string, data?: PositionType) => {
    if (type === "cancel") setSelectPositionModal(defaultSelectPositionModal);
    else if (type === "edit") {
      setSelectPositionModal(defaultSelectPositionModal);
  setPositionModal({ show: true, mode: "edit", position: data ?? null });
    } else if (type === "delete") {
      setSelectPositionModal(defaultSelectPositionModal);
  setDeletePositionModal({ show: true, position: data ?? null });
    }
  };

  const handleConfirmDelete = async (type: string) => {
    if (type === "cancel") setDeletePositionModal(defaultDeletePositionModal);
    else if (type === "delete") {
      setDeletePositionModal(defaultDeletePositionModal);
      if (deletePositionModal.position) {
        deletePosition(robotPath as string, deletePositionModal.position)
          .then((res: PositionType[]) => setPositions(res))
          .catch((err: unknown) => console.error(err));
      }
    }
  };

  const makeActionsFromRefs = (): Action[] => {
    const out: Action[] = [];
    let lastType: string | null = null;

    for (const act of (sequence?.actions || []) as Action[]) {
      const theObjRaw = timelineObjects?.find((obj) => obj.appId === act.appId);
      if (!theObjRaw) {
        // don't throw here - timelineObjects can change between checks and render
        // log a helpful warning and skip the missing reference so the UI stays
        // usable rather than crashing.
        console.warn("Sequence.makeActionsFromRefs: missing referenced object with appId", act.appId);
        // reset lastType because we don't have a meaningful type to compare
        lastType = null;
        continue;
      }

      const theObj = JSON.parse(JSON.stringify(theObjRaw)) as TimelineItem;

      // id and appId are optional on TimelineItem so delete is allowed
      delete (theObj as any).id;
      delete (theObj as any).appId;

      if (theObj.type === "move" && lastType === "move") {
        const previouState = out.pop() as any;
        previouState.content = (previouState.content || "") + "/" + (theObj.content || "");
        (theObj.servos || []).forEach((servo: ServoType, idx: number) => {
          if (servo.enabled) previouState.servos[idx] = servo;
        });
        out.push(previouState as Action);
      } else {
        out.push(theObj as Action);
      }

      lastType = theObj.type ?? null;
    }
    return out;
  };

  const handleConfirmDeleteSequence = (data: string) => {
    if (data === "cancel") {
      setConfirmDeleteSequenceModal(defaultConfirmDeleteSequenceModal);
    } else if (data === "delete") sequenceDelete();
  };

  const Modals = () => (
    <>
      {positionModal.mode !== null ? <EditPositionModal mode={positionModal.mode} position={positionModal.position} out={handlePositionModal} /> : null}
  {selectPositionModal.show ? <SelectPositionModal positions={modalPositions || []} out={handleSelectPosition} /> : null}
      {deletePositionModal.show ? <ConfirmDeletePositionModal position={deletePositionModal.position} out={handleConfirmDelete} /> : null}
      {confirmDeleteSequenceModal.show ? <ConfirmDeleteSequenceModal name={confirmDeleteSequenceModal.name} out={handleConfirmDeleteSequence} /> : null}
    </>
  );

  const TypeSelector = () => (
    <Box p={1} sx={{ border: "3px dashed  limegreen" }}>
      <Stack direction="row-reverse">
        <Box width="40px" />
        <Box component={Paper}>
          <Stack direction="row" p={1} spacing={1}>
            <Button variant="contained">Wait</Button>
            <Button variant="contained">Move</Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <Stack height={"100%"} width={"100%"} maxWidth={"100vw"} sx={{ overflow: "hidden" }}>
      <Stack direction="row" width={"100vw"} spacing={1} p={1} bgcolor="orange">
        <Box width={"100%"}>
          <TextField sx={{ width: "100%" }} label="Sequence Name" error={sequence.name === ""} size="small" variant="standard" value={sequence.name} onChange={(e) => setSequence((old: any) => ({ ...old, name: e.target.value }))} />
        </Box>
        <Box>
          <Tooltip title="New Position">
            <IconButton color="inherit" size="small" onClick={() => setPositionModal({ show: true, mode: "new", position: makeDefaultPosition() })}>
              <ControlPointDuplicateIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Edit Position">
            <IconButton size="small" color="inherit" onClick={() => { setModalPositions(positions); setSelectPositionModal({ show: true }); }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ justifyContent: "center" }}>
          <IconButton color="info" disabled={!isSavable()} size="small" onClick={sequenceSave}>
            <Tooltip title="Save Sequence">
              <SaveIcon />
            </Tooltip>
          </IconButton>
        </Box>
        {sequenceId !== "newsequenceplaceholder" ? (
          <Box>
              <Tooltip title="Delete Sequence">
              <IconButton size="small" color="error" onClick={() => setConfirmDeleteSequenceModal({ show: true, name: sequence?.name ?? "" })}>
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : null}

        <Box>
          <Tooltip title="Return to robot">
            <IconButton color="inherit" sx={{ whiteSpace: "nowrap" }} size="small" onClick={() => navigate("/robot/" + robotPath)}>
              <KeyboardReturnIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
      <Divider />
      <Box height={"100%"} p={1}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Stack height={"100%"} justifyContent={"space-around"}>
            <TypeSelector />
            <TimelineObjects />
            <Timeline />
          </Stack>
        </DragDropContext>
      </Box>
      <Transport actions={makeActionsFromRefs()} />
      <Modals />
    </Stack>
  );
};
