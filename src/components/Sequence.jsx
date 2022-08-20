import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Stack, Paper, Typography } from "@mui/material";
import { Transport } from "./Transport";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { v4 as uuid } from "uuid";

const getItemStyle = (isDragging, draggableStyle) => ({
  background: isDragging ? "#757ce8" : "salmon",
  ...draggableStyle,
});

const delays = [
  { id: uuid(), content: "1s", type: "delay", value: 10 },
  { id: uuid(), content: "3s", type: "delay", value: 30 },
  { id: uuid(), content: "5s", type: "delay", value: 50 },
  { id: uuid(), content: "10s", type: "delay", value: 100 },
];

const defaultPositions = [
  { id: uuid(), content: "p1", type: "move", servos: [1, 1] },
  { id: uuid(), content: "p2", type: "move", servos: [179, 179] },
  { id: uuid(), content: "p3", type: "move", servos: [179, 1] },
  { id: uuid(), content: "p4", type: "move", servos: [1, 179] },
];

const TIMELINE_ITEMS = [];

export const Sequence = () => {
  const makeObjects = () => [...delays, ...defaultPositions];

  const [actions, setActions] = useState(TIMELINE_ITEMS);
  const [timelineObjects, setTimelineObjects] = useState(makeObjects());
  const [trash, setTrash] = useState([]);

  useEffect(() => window.electron.send("play", "sequence.mp3"), []);
  console.log("Render Sequence");

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
      <Typography variant="body2">{JSON.stringify(itm.servos)}</Typography>
    </Box>
  );

  const onDragEnd = res => {
    if (
      res.source.droppableId === "objects" &&
      res.destination.droppableId === "timeline"
    ) {
      let objCpy = JSON.parse(
        JSON.stringify(timelineObjects[res.source.index])
      );
      objCpy.id = uuid();
      let actionsCpy = JSON.parse(JSON.stringify(actions));
      actionsCpy.splice(res.destination.index, 0, objCpy);
      setActions(actionsCpy);
      window.electron.send("play", "timeline_add.mp3");
      console.log("Added Item To Timeline");
    } else if (
      res.source.droppableId === "timeline" &&
      res.destination.droppableId === "timeline"
    ) {
      let actionsCpy = JSON.parse(JSON.stringify(actions));
      let cutAction = actionsCpy.splice(res.source.index, 1)[0];
      actionsCpy.splice(res.destination.index, 0, cutAction);
      setActions(actionsCpy);
      window.electron.send("play", "timeline_move.mp3");
      console.log("Moved Item IN Timeline");
    } else if (
      res.source.droppableId === "timeline" &&
      res.destination.droppableId === "trash"
    ) {
      console.log(res);
      setActions(old => old.filter((x, idx) => idx !== res.source.index));
      window.electron.send("play", "trash.mp3");
      console.log("TRASHED");
    }
  };

  const makeItem = itm => {
    if (itm.type === "delay") {
      return <DelayItem itm={itm} />;
    } else if (itm.type === "move") {
      return <PositionItem itm={itm} />;
    }
  };

  const TimelineObjects = () => {
    return (
      <Box p={1}>
        <Box component={Paper} elevation={4}>
          <Box sx={{ paddingLeft: "4px" }}>
            <Typography variant="h6">OBJECTS</Typography>
            <Typography variant="body2">
              These items can be dragged to the timeline
            </Typography>
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
                direction={"horizontal"}
                p={1}
                width={"100%"}
                spacing={1}
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
                          p={1}
                          sx={{ border: "1px solid" }}
                        >
                          {makeItem(itm)}
                        </Box>
                        {snapshot.isDragging && (
                          <Box
                            component={Paper}
                            p={1}
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
            <Typography variant="body2">
              These objects can be reordered or moved to the trash
            </Typography>
          </Box>
          <Droppable droppableId="timeline" direction="horizontal">
            {provided => (
              <Stack
                ref={provided.innerRef}
                {...provided.droppableProps}
                direction={"horizontal"}
                p={1}
                width={"100%"}
                spacing={1}
                sx={{ border: "1px solid", overflowY: "auto" }}
              >
                {actions.map((itm, idx) => (
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

  const Trash = () => {
    return (
      <Box p={1}>
        <Box component={Paper} elevation={4}>
          <Box sx={{ paddingLeft: "4px" }}>
            <Typography variant="h6">Trash</Typography>
            <Typography variant="body2">
              To remove objects from timeline drag them here
            </Typography>
          </Box>
          <Droppable droppableId="trash" direction="horizontal">
            {provided => (
              <Stack
                ref={provided.innerRef}
                {...provided.droppableProps}
                direction={"horizontal"}
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

  return (
    <Box height={"100%"}>
      <Stack height={"100%"} sx={{ overflow: "hidden" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <TimelineObjects />
          {/* <Box height={"100%"} sx={{ overflow: "auto" }} p={1}></Box> */}
          <Timeline />
          <Trash />
        </DragDropContext>
        <Box height={"100%"} sx={{ overflow: "auto" }} p={1}></Box>
        <Transport actions={actions} />
      </Stack>
    </Box>
  );
};
