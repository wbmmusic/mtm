import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import {
  Stack,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  LinearProgress,
  Menu,
  MenuItem,
} from "@mui/material";
import { Transport } from "./Transport";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { useNavigate, useParams } from "react-router-dom";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import { EditPositionModal } from "./EditPositionModal";
import { v4 as uuid } from "uuid";
import {
  createPosition,
  deletePosition,
  deleteSequence,
  getRobot,
  saveSequence,
  updatePosition,
  updateSequence,
} from "../../helpers";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { SelectPositionModal } from "./SelectPositionModal";
import { ConfirmDeletePositionModal } from "./ConfirmDeletePositionModal";
import { delays } from "./Constants";
import { ConfirmDeleteSequenceModal } from "./ConfirmDeleteSequenceModal";

const defaultPositionModal = { show: false, mode: null, position: null };
const defaultSelectPositionModal = { show: false };
const defaultDeletePositionModal = { show: false, position: null };
const defaultSequence = { appId: uuid(), name: "", actions: [] };
const defaultConfirmDeleteSequenceModal = { show: false, name: null };

export const Sequence = () => {
  const navigate = useNavigate();
  const { robotPath, sequenceId } = useParams();

  const [confirmDeleteSequenceModal, setConfirmDeleteSequenceModal] = useState(
    defaultConfirmDeleteSequenceModal
  );
  const [robot, setRobot] = useState(null);
  const [timelineObjects, setTimelineObjects] = useState([]);
  const [trash, setTrash] = useState([]);
  const [positionModal, setPositionModal] = useState(defaultPositionModal);
  const [anchorEl, setAnchorEl] = useState(null);
  const [ogSequense, setOgSequense] = useState(null);
  const [deletePositionModal, setDeletePositionModal] = useState(
    defaultDeletePositionModal
  );
  const [selectPositionModal, setSelectPositionModal] = useState(
    defaultSelectPositionModal
  );

  const open = Boolean(anchorEl);

  const initSequence = () => {
    if (sequenceId === "newsequenceplaceholder") return defaultSequence;
  };

  const [sequence, setSequence] = useState(initSequence());

  const loadSequence = () => {
    if (!robot) return;
    console.log("Load Sequence", sequenceId);
    let seq = JSON.parse(
      JSON.stringify(
        robot.sequences.find(
          se => se.appId.toString() === sequenceId.toString()
        )
      )
    );
    if (!seq) throw new Error("Didnt find sequence");
    let out = [];
    seq.actions.forEach(act => {
      const insert = { type: act.type, appId: act.appId, id: uuid() };
      out.push(insert);
    });

    seq.actions = out;
    setSequence(seq);
    setOgSequense(JSON.parse(JSON.stringify(seq)));
  };

  const makeObjects = () => {
    let out = [...delays];
    robot.positions.forEach(position => {
      out.push({
        id: uuid(),
        appId: position.appId,
        content: position.name,
        type: "move",
        servos: position.servos,
      });
    });
    setTimelineObjects(out);
  };

  const setTheRobot = async () => {
    try {
      const theRobot = await getRobot(robotPath);
      setRobot(theRobot);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    window.electron.send("play", "sequence.mp3");
    setTheRobot();
  }, []);

  useEffect(() => {
    if (robot) {
      makeObjects();
      if (sequenceId !== "newsequenceplaceholder") loadSequence();
    }
  }, [robot]);

  useEffect(() => {
    //console.log(sequence);
    //console.log(timelineObjects);
    //console.log(makeOutput());
  }, [sequence]);

  if (!sequence) return;

  const handleClick = event => setAnchorEl(event.currentTarget);

  const handleClose = () => setAnchorEl(null);

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
        .then(res => setTheRobot())
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
    <Stack height={"40px"}>
      <Box>
        <Typography
          variant="body2"
          sx={{ textAlign: "center", whiteSpace: "nowrap" }}
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

  const PositionItem = ({ itm }) => (
    <Box height={"100%"}>
      <Typography variant="body2">{itm.content}</Typography>
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

      let actionsCopy = JSON.parse(JSON.stringify(sequence.actions));
      const insert = { type: objCpy.type, appId: objCpy.appId, id: uuid() };
      actionsCopy.splice(res.destination.index, 0, insert);

      setSequence(old => ({ ...old, actions: actionsCopy }));

      window.electron.send("play", "timeline_add.mp3");
      // console.log("Added Item To Timeline");
    } else if (
      res.source.droppableId === "timeline" &&
      res.destination.droppableId === "timeline"
    ) {
      let actionsCpy = JSON.parse(JSON.stringify(sequence.actions));
      let cutAction = actionsCpy.splice(res.source.index, 1)[0];
      actionsCpy.splice(res.destination.index, 0, cutAction);
      setSequence(old => ({ ...old, actions: actionsCpy }));
      window.electron.send("play", "timeline_move.mp3");
      // console.log("Moved Item IN Timeline");
    } else if (
      res.source.droppableId === "timeline" &&
      res.destination.droppableId === "trash"
    ) {
      setSequence(old => ({
        ...old,
        actions: old.actions.filter((x, idx) => idx !== res.source.index),
      }));
      window.electron.send("play", "trash.mp3");
      // console.log("TRASHED");
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
    }
  };

  const makeDefaultPosition = () => {
    return null;
  };

  const handlePositionModal = async (type, data) => {
    // console.log("Position Modal Out", type);
    if (type === "cancel") setPositionModal(defaultPositionModal);
    else if (type === "createPosition") {
      setPositionModal(defaultPositionModal);
      await createPosition(robotPath, data);
      setTheRobot();
    } else if (type === "updatePosition") {
      await updatePosition(robotPath, data);
      setPositionModal(defaultPositionModal);
      setTheRobot();
    }
  };

  const TimelineObjects = () => {
    return (
      <Box p={1}>
        <Box component={Paper} elevation={4}>
          <Box sx={{ paddingLeft: "4px" }}>
            <Typography variant="h6">OBJECTS</Typography>
          </Box>
          <Droppable
            droppableId="objects"
            direction="horizontal"
            isDropDisabled={true}
          >
            {provided => (
              <Stack
                ref={provided.innerRef}
                {...provided.droppableProps}
                direction={"row"}
                p={0.5}
                width={"100%"}
                spacing={0.5}
                sx={{ border: "1px solid" }}
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
                          sx={{ border: "1px solid" }}
                        >
                          {makeItem(itm)}
                        </Box>
                        {snapshot.isDragging && (
                          <Box
                            component={Paper}
                            p={0.5}
                            sx={{ border: "1px solid" }}
                          >
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
      <Box p={1}>
        <Box width={"100%"} component={Paper} elevation={4}>
          <Box sx={{ paddingLeft: "4px" }}>
            <Typography variant="h6">Timeline</Typography>
          </Box>
          <Droppable droppableId="timeline" direction="horizontal">
            {provided => (
              <Stack
                ref={provided.innerRef}
                {...provided.droppableProps}
                direction={"row"}
                p={1}
                width={"100%"}
                spacing={0.5}
                sx={{ border: "1px solid" }}
              >
                {sequence.actions.map((act, idx) => {
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
                            sx={{ border: "1px solid" }}
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

  const Trash = () => {
    return (
      <Box p={1}>
        <Box component={Paper} elevation={4}>
          <Box sx={{ paddingLeft: "4px" }}>
            <Typography variant="h6">Trash</Typography>
          </Box>
          <Droppable droppableId="trash" direction="horizontal">
            {provided => (
              <Stack
                ref={provided.innerRef}
                {...provided.droppableProps}
                direction={"row"}
                p={1}
                width={"100%"}
                spacing={1}
                sx={{ border: "1px solid" }}
                height={"50px"}
              >
                {trash.map((itm, idx) => (
                  <Draggable
                    key={"itm" + itm.id}
                    draggableId={itm.id}
                    index={idx}
                  >
                    {provided2 => {
                      return (
                        <Box
                          component={Paper}
                          ref={provided2.innerRef}
                          {...provided2.draggableProps}
                          {...provided2.dragHandleProps}
                          p={1}
                          sx={{ border: "1px solid" }}
                        >
                          {makeItem(itm)}
                        </Box>
                      );
                    }}
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
      try {
        await deletePosition(robotPath, deletePositionModal.position);
        setTheRobot();
      } catch (error) {
        console.error(error);
      }
      setDeletePositionModal(defaultDeletePositionModal);
    }
  };

  const makeActionsFromRefs = () => {
    let out = [];
    sequence.actions.forEach(act =>
      out.push(timelineObjects.find(obj => obj.appId === act.appId))
    );
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
          robot={robot}
          out={handlePositionModal}
        />
      ) : null}
      {selectPositionModal.show ? (
        <SelectPositionModal
          positions={robot.positions}
          out={handleSelectPosition}
        />
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

  // console.log(actions, timelineObjects);

  return (
    <Stack
      height={"100%"}
      width={"100%"}
      maxWidth={"100vw"}
      sx={{ overflow: "hidden" }}
    >
      <Stack direction="row" width={"100vw"} spacing={1} p={1}>
        <Box width={"100%"}>
          <TextField
            sx={{ width: "100%" }}
            label="Sequence Name"
            size="small"
            variant="standard"
            value={sequence.name}
            onChange={e =>
              setSequence(old => ({ ...old, name: e.target.value }))
            }
          />
        </Box>
        <Box>
          <Button
            size="small"
            startIcon={anchorEl ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            id="basic-button"
            aria-controls={open ? "basic-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
          >
            Position
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            <MenuItem
              onClick={() => {
                handleClose();
                setPositionModal({
                  show: true,
                  mode: "new",
                  position: makeDefaultPosition(),
                });
              }}
            >
              New Position
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleClose();
                setSelectPositionModal({
                  show: true,
                  positions: robot.positions,
                });
              }}
            >
              Edit Position
            </MenuItem>
          </Menu>
        </Box>
        <Box sx={{ justifyContent: "center" }}>
          <Button disabled={!isSavable()} size="small" onClick={sequenceSave}>
            Save
          </Button>
        </Box>
        {sequenceId !== "newsequenceplaceholder" ? (
          // if nit read only //////////////////////////////////////////////////////////////////
          <Box>
            <Button
              size="small"
              color="error"
              onClick={() => {
                console.log(sequence.name);
                setConfirmDeleteSequenceModal({
                  show: true,
                  name: sequence.name,
                });
              }}
            >
              Delete
            </Button>
          </Box>
        ) : null}

        <Box>
          <Button
            startIcon={<KeyboardReturnIcon />}
            sx={{ whiteSpace: "nowrap" }}
            size="small"
            onClick={() => navigate("/robot/" + robotPath)}
          >
            Back to robot
          </Button>
        </Box>
      </Stack>
      <Divider />
      <DragDropContext onDragEnd={onDragEnd}>
        <TimelineObjects />
        <Timeline />
        <Trash />
      </DragDropContext>
      <Box height={"100%"} p={1}></Box>
      <Transport actions={makeActionsFromRefs()} />
      <Modals />
    </Stack>
  );
};
