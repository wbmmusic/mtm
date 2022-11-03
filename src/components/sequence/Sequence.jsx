import React, { useEffect, useState } from "react";
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
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
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
import { ConfirmDeleteSequenceModal } from "./ConfirmDeleteSequenceModal";

const defaultPositionModal = { show: false, mode: null, position: null };
const defaultSelectPositionModal = { show: false };
const defaultDeletePositionModal = { show: false, position: null };
const defaultSequence = { appId: uuid(), name: "", actions: [] };
const defaultConfirmDeleteSequenceModal = { show: false, name: null };

const droppableStyle = {
  border: "6px solid #55533c",
  borderLeft: "20px solid #55533c",
  borderRight: "20px solid #55533c",
  overflowX: "auto",
  minHeight: "80px",
  backgroundColor: "lightGrey",
  boxShadow: "2px 2px magenta, 6px 6px black",
};

export const Sequence = () => {
  const navigate = useNavigate();
  const { robotPath, sequenceId } = useParams();

  const [confirmDeleteSequenceModal, setConfirmDeleteSequenceModal] = useState(
    defaultConfirmDeleteSequenceModal
  );
  const [timelineObjects, setTimelineObjects] = useState(null);
  const [positions, setPositions] = useState(null);
  const [positionModal, setPositionModal] = useState(defaultPositionModal);
  const [ogSequense, setOgSequense] = useState(null);
  const [deletePositionModal, setDeletePositionModal] = useState(
    defaultDeletePositionModal
  );
  const [selectPositionModal, setSelectPositionModal] = useState(
    defaultSelectPositionModal
  );

  const initSequence = () => {
    if (sequenceId === "newsequenceplaceholder") return defaultSequence;
    else return null;
  };

  const [sequence, setSequence] = useState(initSequence());

  const setTheSequences = seq => {
    setSequence(JSON.parse(JSON.stringify(seq)));
    setOgSequense(JSON.parse(JSON.stringify(seq)));
  };

  const makeObjects = () => {
    // console.log("MakeObjects");
    let out = [...delays, ...waitStates];
    if (positions) {
      positions.forEach(position => {
        out.push({
          id: uuid(),
          appId: position.appId,
          content: position.name,
          type: "move",
          servos: position.servos,
        });
      });
    }

    setTimelineObjects(out);
  };

  const loadSequence = () => {
    console.log("Load Sequence", sequenceId);
    getSequence(robotPath, sequenceId)
      .then(res => {
        let tempSeq = JSON.parse(JSON.stringify(res));
        // Give each a unique id
        tempSeq.actions.forEach(act => (act.id = uuid()));
        setTheSequences(tempSeq);
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    window.electron.send("play", "sequence.mp3");
    makeObjects();

    getPositions(robotPath)
      .then(res => setPositions(res))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (sequenceId !== "newsequenceplaceholder") loadSequence();
  }, [sequenceId]);

  useEffect(() => makeObjects(), [positions]);

  const haveEverything = () => {
    if (sequence) {
      let out = true;
      sequence.actions.forEach(act => {
        const idx = timelineObjects.findIndex(obj => obj.appId === act.appId);
        if (idx < 0) out = false;
      });
      return out;
    }
  };

  if (!positions || !sequence || !timelineObjects || !haveEverything()) {
    console.log("Skipping render");
    return;
  }

  const makeOutput = () => {
    // Strips unwanted keys from sequence.actions[]
    let tempSeq = JSON.parse(JSON.stringify(sequence));
    tempSeq.actions.forEach(act => {
      delete act.type;
      delete act.id;
    });
    return tempSeq;
  };

  const sequenceSave = () => {
    if (sequenceId !== "newsequenceplaceholder") {
      updateSequence(robotPath, makeOutput())
        .then(res => loadSequence())
        .catch(err => console.log(err));
    } else {
      saveSequence(robotPath, makeOutput())
        .then(res => navigate(`/sequence/${robotPath}/${sequence.appId}`))
        .catch(err => console.log(err));
    }
  };

  const sequenceDelete = () => {
    deleteSequence(robotPath, makeOutput())
      .then(res => navigate("/robot/" + robotPath))
      .catch(err => console.log(err));
  };

  const DelayItem = ({ itm }) => (
    <Stack height={"100%"}>
      <Box>
        <Typography
          variant="body2"
          sx={{ textAlign: "center", whiteSpace: "nowrap", fontSize: "9px" }}
        >
          {itm.content}
        </Typography>
      </Box>
      <Box height={"100%"}>
        <Box
          m={"auto"}
          height={"100%"}
          width={itm.value / 2 + "px"}
          sx={{ backgroundColor: "lightGrey" }}
        />
      </Box>
    </Stack>
  );

  const WaitItem = ({ itm }) => (
    <Stack height={"100%"}>
      <Box>
        <Typography
          variant="body2"
          sx={{ textAlign: "center", whiteSpace: "nowrap", fontSize: "9px" }}
        >
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

  const PositionItem = ({ itm }) => (
    <Box height={"100%"}>
      <Typography sx={{ fontSize: "9px" }} variant="body2">
        {itm.content}
      </Typography>
      <Stack spacing={0.5}>
        {itm.servos.map((servo, idx) => (
          <LinearProgress
            key={"servo" + idx + itm.name}
            color={servo.enabled ? "primary" : "inherit"}
            variant="determinate"
            max={180}
            value={(servo.value * 100) / 180}
          />
        ))}
      </Stack>
    </Box>
  );

  const onDragEnd = res => {
    // console.log(res);
    if (
      res.source.droppableId === "objects" &&
      res.destination.droppableId === "timeline"
    ) {
      let objCpy = JSON.parse(
        JSON.stringify(timelineObjects[res.source.index])
      );
      window.electron.send("play", "timeline_add.mp3");
      let actionsCopy = JSON.parse(JSON.stringify(sequence.actions));
      const insert = { type: objCpy.type, appId: objCpy.appId, id: uuid() };
      actionsCopy.splice(res.destination.index, 0, insert);

      setSequence(old => ({ ...old, actions: actionsCopy }));

      // console.log("Added Item To Timeline");
    } else if (res.source.droppableId === "timeline" && !res.destination) {
      window.electron.send("play", "trash.mp3");
      setSequence(old => ({
        ...old,
        actions: old.actions.filter((x, idx) => idx !== res.source.index),
      }));

      // console.log("TRASHED");
    } else if (
      res.source.droppableId === "timeline" &&
      res.destination.droppableId === "timeline"
    ) {
      window.electron.send("play", "timeline_move.mp3");
      let actionsCpy = JSON.parse(JSON.stringify(sequence.actions));
      let cutAction = actionsCpy.splice(res.source.index, 1)[0];
      actionsCpy.splice(res.destination.index, 0, cutAction);
      setSequence(old => ({ ...old, actions: actionsCpy }));
      // console.log("Moved Item IN Timeline");
    }
    // console.log("END", actions, timelineObjects);
    // console.log("Actions", actions);
    // console.log("Objects", timelineObjects);
  };

  const makeItem = itm => {
    if (itm.type === "delay") {
      return <DelayItem itm={itm} />;
    } else if (itm.type === "move") {
      return <PositionItem itm={itm} />;
    } else if (itm.type === "wait") {
      return <WaitItem itm={itm} />;
    }
  };

  const makeDefaultPosition = () => {
    return null;
  };

  const handlePositionModal = (type, data) => {
    // console.log("Position Modal Out", type);
    if (type === "cancel") setPositionModal(defaultPositionModal);
    else if (type === "createPosition") {
      setPositionModal(defaultPositionModal);
      createPosition(robotPath, data)
        .then(res => setPositions(res))
        .catch(err => console.log(err));
    } else if (type === "updatePosition") {
      setPositionModal(defaultPositionModal);
      updatePosition(robotPath, data)
        .then(res => setPositions(res))
        .catch(err => console.log(err));
    }
  };

  const TimelineObjects = () => {
    return (
      <Box p={1} sx={{ border: "3px dashed limegreen" }}>
        <Box>
          <Box sx={{ paddingLeft: "4px" }}>
            <Typography variant="h6">ACTIONS</Typography>
          </Box>
          <Droppable
            droppableId="objects"
            direction="horizontal"
            isDropDisabled={true}
          >
            {provided => (
              <Stack
                component={Paper}
                ref={provided.innerRef}
                {...provided.droppableProps}
                direction={"row"}
                p={0.5}
                width={"100%"}
                spacing={0.5}
                sx={droppableStyle}
              >
                {timelineObjects.map((itm, idx) => (
                  <Draggable
                    key={"timelineitm" + itm.id}
                    draggableId={itm.id}
                    index={idx}
                  >
                    {(provided, snapshot) => (
                      <>
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          component={Paper}
                          p={0.5}
                        >
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

  const Timeline = () => {
    return (
      <Box p={1} sx={{ border: "3px dashed limegreen" }}>
        <Box width={"100%"}>
          <Box sx={{ paddingLeft: "4px" }}>
            <Stack direction="row" spacing={4}>
              <Typography variant="h6">MY SEQUENCE</Typography>
              {sequence.actions.length > 0 ? (
                <Button
                  color="error"
                  size="small"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to clear the timeline?"
                      )
                    ) {
                      setSequence(old => ({ ...old, actions: [] }));
                    }
                  }}
                >
                  Clear Timeline
                </Button>
              ) : null}
            </Stack>
          </Box>
          <Droppable droppableId="timeline" direction="horizontal">
            {provided => (
              <Stack
                component={Paper}
                ref={provided.innerRef}
                {...provided.droppableProps}
                direction={"row"}
                p={1}
                width={"100%"}
                spacing={0.5}
                sx={droppableStyle}
              >
                {sequence.actions.map((act, idx) => {
                  // console.log("ACT ->", act.appId);
                  // console.log(timelineObjects);
                  // console.log(
                  //   timelineObjects.find(obj => obj.appId === act.appId)
                  // );
                  let itm = JSON.parse(
                    JSON.stringify(
                      timelineObjects.find(obj => obj.appId === act.appId)
                    )
                  );
                  itm.id = act.id;
                  return (
                    <Draggable
                      key={"timelineItm" + act.id}
                      draggableId={"timelineItmID" + act.id}
                      index={idx}
                    >
                      {provided2 => {
                        return (
                          <Box
                            component={Paper}
                            ref={provided2.innerRef}
                            {...provided2.draggableProps}
                            {...provided2.dragHandleProps}
                            p={0.5}
                          >
                            {makeItem(itm)}
                          </Box>
                        );
                      }}
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

  const handleSelectPosition = async (type, data) => {
    if (type === "cancel") setSelectPositionModal(defaultSelectPositionModal);
    else if (type === "edit") {
      // console.log("Edit", data);
      setSelectPositionModal(defaultSelectPositionModal);
      setPositionModal({
        show: true,
        mode: "edit",
        position: data,
      });
    } else if (type === "delete") {
      setSelectPositionModal(defaultSelectPositionModal);
      setDeletePositionModal({ show: true, position: data });
    }
  };

  const handleConfirmDelete = async type => {
    if (type === "cancel") setDeletePositionModal(defaultDeletePositionModal);
    else if (type === "delete") {
      setDeletePositionModal(defaultDeletePositionModal);
      deletePosition(robotPath, deletePositionModal.position)
        .then(res => setPositions(res))
        .catch(err => console.error(err));
    }
  };

  const makeActionsFromRefs = () => {
    let out = [];
    let lastType = null;

    sequence.actions.forEach(act => {
      let theObj = timelineObjects.find(obj => obj.appId === act.appId);
      if (!theObj) {
        throw new Error("Didn't find object with appId " + act.appId);
      }

      // Clone the object for editing
      theObj = JSON.parse(JSON.stringify(theObj));

      // Remove unneeded keys
      delete theObj.id;
      delete theObj.appId;

      // If there are multiple moves in a row
      if (theObj.type === "move" && lastType === "move") {
        // console.log("Found Double");
        let previouState = out.pop();

        // Combine Names
        previouState.content = previouState.content + "/" + theObj.content;

        // update servo value
        theObj.servos.forEach((servo, idx) => {
          if (servo.enabled) previouState.servos[idx] = servo;
        });

        // console.log(previouState);
        out.push(previouState);
      } else out.push(theObj);

      lastType = theObj.type;
    });
    //console.log(out);
    return out;
  };

  const handleConfirmDeleteSequence = data => {
    if (data === "cancel") {
      setConfirmDeleteSequenceModal(defaultConfirmDeleteSequenceModal);
    } else if (data === "delete") sequenceDelete();
  };

  const Modals = () => (
    <>
      {positionModal.mode !== null ? (
        <EditPositionModal
          mode={positionModal.mode}
          position={positionModal.position}
          out={handlePositionModal}
        />
      ) : null}
      {selectPositionModal.show ? (
        <SelectPositionModal positions={positions} out={handleSelectPosition} />
      ) : null}
      {deletePositionModal.show ? (
        <ConfirmDeletePositionModal
          position={deletePositionModal.position}
          out={handleConfirmDelete}
        />
      ) : null}
      {confirmDeleteSequenceModal.show ? (
        <ConfirmDeleteSequenceModal
          name={confirmDeleteSequenceModal.name}
          out={handleConfirmDeleteSequence}
        />
      ) : null}
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

  // console.log(sequence.actions, timelineObjects);

  return (
    <Stack
      height={"100%"}
      width={"100%"}
      maxWidth={"100vw"}
      sx={{ overflow: "hidden" }}
    >
      <Stack direction="row" width={"100vw"} spacing={1} p={1} bgcolor="orange">
        <Box width={"100%"}>
          <TextField
            sx={{ width: "100%" }}
            label="Sequence Name"
            error={sequence.name === ""}
            size="small"
            variant="standard"
            value={sequence.name}
            onChange={e =>
              setSequence(old => ({ ...old, name: e.target.value }))
            }
          />
        </Box>
        <Box>
          <Tooltip title="New Position">
            <IconButton
              color="inherit"
              size="small"
              onClick={() => {
                setPositionModal({
                  show: true,
                  mode: "new",
                  position: makeDefaultPosition(),
                });
              }}
            >
              <ControlPointDuplicateIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Edit Position">
            <IconButton
              size="small"
              color="inherit"
              onClick={() => {
                setSelectPositionModal({
                  show: true,
                  positions,
                });
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ justifyContent: "center" }}>
          <IconButton
            color="info"
            disabled={!isSavable()}
            size="small"
            onClick={sequenceSave}
          >
            <Tooltip title="Save Sequence">
              <SaveIcon />
            </Tooltip>
          </IconButton>
        </Box>
        {sequenceId !== "newsequenceplaceholder" ? (
          // if nit read only //////////////////////////////////////////////////////////////////
          <Box>
            <Tooltip title="Delete Sequence">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  // console.log(sequence.name);
                  setConfirmDeleteSequenceModal({
                    show: true,
                    name: sequence.name,
                  });
                }}
              >
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : null}

        <Box>
          <Tooltip title="Return to robot">
            <IconButton
              color="inherit"
              sx={{ whiteSpace: "nowrap" }}
              size="small"
              onClick={() => navigate("/robot/" + robotPath)}
            >
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
