import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Stack, Paper, Typography } from "@mui/material";
import { Transport } from "./Transport";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { v4 as uuid } from "uuid";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const getItemStyle = (isDragging, draggableStyle) => ({
  background: isDragging ? "#757ce8" : "salmon",
  ...draggableStyle,
});
// const getListStyle = (isDraggingOver) => ({
//   background: isDraggingOver ? "#1769aa" : "lightgrey",
//   padding: "10px"
//  });

const delays = [
  { id: uuid(), content: "2 Sec", type: "delay", value: 20 },
  { id: uuid(), content: "4 Sec", type: "delay", value: 40 },
  { id: uuid(), content: "8 Sec", type: "delay", value: 80 },
  { id: uuid(), content: "12 Sec", type: "delay", value: 120 },
];

const TIMELINE_ITEMS = [
  { id: uuid(), content: "One", type: "move" },
  { id: uuid(), content: "Two", type: "move" },
  { id: uuid(), content: "Three", type: "move" },
  { id: uuid(), content: "Four", type: "move" },
  { id: uuid(), content: "Five", type: "move" },
];

export const Sequence = () => {
  const [actions, setActions] = useState(TIMELINE_ITEMS);

  useEffect(() => window.electron.send("play", "sequence.mp3"), []);

  const DelayItem = ({ itm }) => (
    <Stack>
      <Box>
        <Typography
          variant="body2"
          sx={{ textAlign: "center", whiteSpace: "nowrap" }}
        >
          {itm.content}
        </Typography>
      </Box>
      <Box>
        <Box
          m={"auto"}
          height={"30px"}
          width={itm.value + "px"}
          sx={{ backgroundColor: "lightGrey" }}
        />
      </Box>
    </Stack>
  );

  const onDragEnd = res => {
    if (
      res.source.droppableId === "objects" &&
      res.destination.droppableId === "timeline"
    ) {
      let objCpy = JSON.parse(JSON.stringify(delays[res.source.index]));
      objCpy.id = uuid();
      let actionsCpy = JSON.parse(JSON.stringify(actions));
      actionsCpy.splice(res.destination.index, 0, objCpy);
      setActions(actionsCpy);
      console.log("Added Item To Timeline");
    } else if (
      res.source.droppableId === "timeline" &&
      res.destination.droppableId === "timeline"
    ) {
      let actionsCpy = JSON.parse(JSON.stringify(actions));
      let cutAction = actionsCpy.splice(res.source.index, 1)[0];
      actionsCpy.splice(res.destination.index, 0, cutAction);
      setActions(actionsCpy);
      console.log("Moved Item IN Timeline");
    }
  };

  const TimelineObjects = () => {
    return (
      <Box sx={{ border: "1px solid" }}>
        <Typography>Objects</Typography>
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
              {delays.map((itm, idx) => (
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
                        <DelayItem itm={itm} />
                      </Box>
                      {snapshot.isDragging && (
                        <Box
                          component={Paper}
                          p={1}
                          sx={{ border: "1px solid" }}
                        >
                          <DelayItem itm={itm} />
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
    );
  };

  const Timeline = () => {
    return (
      <Box width={"100%"} sx={{ border: "1px solid" }}>
        <Typography>Timeline</Typography>
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
                    if (itm.type === "delay") {
                      return (
                        <Box
                          component={Paper}
                          ref={provided2.innerRef}
                          {...provided2.draggableProps}
                          {...provided2.dragHandleProps}
                          p={1}
                          sx={{ border: "1px solid" }}
                        >
                          <DelayItem itm={itm} />
                        </Box>
                      );
                    } else {
                      return (
                        <Box
                          component={Paper}
                          ref={provided2.innerRef}
                          {...provided2.draggableProps}
                          {...provided2.dragHandleProps}
                          p={1}
                          sx={{ border: "1px solid" }}
                        >
                          <Typography>{itm.content}</Typography>
                        </Box>
                      );
                    }
                  }}
                </Draggable>
              ))}
              {provided.placeholder}
            </Stack>
          )}
        </Droppable>
      </Box>
    );
  };

  return (
    <Box p={1} height={"100%"}>
      <Stack height={"100%"} sx={{ overflow: "hidden" }} spacing={1}>
        <DragDropContext onDragEnd={onDragEnd}>
          <TimelineObjects />
          {/* <Box height={"100%"} sx={{ overflow: "auto" }} p={1}></Box> */}
          <Timeline />
        </DragDropContext>
        <Box height={"100%"} sx={{ overflow: "auto" }} p={1}></Box>
        <Transport actions={actions} />
      </Stack>
    </Box>
  );
};
