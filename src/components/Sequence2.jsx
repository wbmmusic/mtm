import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Stack, Typography } from "@mui/material";
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

const ITEMS = [
  {
    id: uuid(),
    content: "Headline",
  },
  {
    id: uuid(),
    content: "Copy",
  },
  {
    id: uuid(),
    content: "Image",
  },
  {
    id: uuid(),
    content: "Slideshow",
  },
  {
    id: uuid(),
    content: "Quote",
  },
];

const TIMELINE_ITEMS = [
  {
    id: uuid(),
    content: "One",
  },
  {
    id: uuid(),
    content: "Two",
  },
  {
    id: uuid(),
    content: "Three",
  },
  {
    id: uuid(),
    content: "Four",
  },
  {
    id: uuid(),
    content: "Five",
  },
];

export const Sequence2 = () => {
  const [actions, actionssetActions] = useState(TIMELINE_ITEMS);

  useEffect(() => window.electron.send("play", "sequence.mp3"), []);

  const onDragEnd = result => {
    console.log(result);
  };

  const TimelineObjects = () => {
    return (
      <Box>
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
              {ITEMS.map((itm, idx) => (
                <Draggable key={"itm" + idx} draggableId={itm.id} index={idx}>
                  {provided2 => (
                    <Box
                      ref={provided2.innerRef}
                      {...provided2.draggableProps}
                      {...provided2.dragHandleProps}
                      p={1}
                      sx={{ border: "1px solid" }}
                    >
                      <Typography>{itm.content}</Typography>
                    </Box>
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
      <Box>
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
              sx={{ border: "1px solid" }}
            >
              {actions.map((itm, idx) => (
                <Draggable key={"itm" + idx} draggableId={itm.id} index={idx}>
                  {provided2 => (
                    <Box
                      ref={provided2.innerRef}
                      {...provided2.draggableProps}
                      {...provided2.dragHandleProps}
                      p={1}
                      sx={{ border: "1px solid" }}
                    >
                      <Typography>{itm.content}</Typography>
                    </Box>
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

  return (
    <Box p={1} height={"100%"}>
      <Stack height={"100%"} sx={{ overflow: "hidden" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <TimelineObjects />
          <Box height={"100%"} sx={{ overflow: "auto" }} p={1}></Box>
          <Timeline />
        </DragDropContext>
        <Transport actions={actions} />
      </Stack>
    </Box>
  );
};
