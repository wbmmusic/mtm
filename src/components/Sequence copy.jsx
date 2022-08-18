import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import TimerIcon from "@mui/icons-material/Timer";
import ThreeSixtyIcon from "@mui/icons-material/ThreeSixty";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Stack from "@mui/material/Stack";
import React, { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

export const Sequence = () => {
  const [actions, setActions] = useState([
    {
      type: "delay",
      value: 1000,
    },
    {
      type: "move",
    },
  ]);

  const makeActions = () => {
    let out = [];

    actions.forEach((act, idx) => {
      if (act.type === "delay") {
        out.push(
          <Draggable
            key={"draggable" + idx}
            draggableId={"draggable" + idx}
            index={idx}
          >
            <TableRow>
              <TableCell>
                <Box sx={{ cursor: "grab" }}>
                  <DragHandleIcon />
                </Box>
              </TableCell>
              <TableCell>
                <Typography>00:00:00</Typography>
              </TableCell>
              <TableCell>
                <TimerIcon />
              </TableCell>
              <TableCell>Delay X sec</TableCell>
            </TableRow>
          </Draggable>
        );
      } else if (act.type === "move") {
        out.push(
          <Draggable
            key={"draggable" + idx}
            draggableId={"draggable" + idx}
            index={idx}
          >
            <TableRow>
              <TableCell>
                <Box sx={{ cursor: "grab" }}>
                  <DragHandleIcon />
                </Box>
              </TableCell>
              <TableCell>
                <Typography>00:00:00</Typography>
              </TableCell>
              <TableCell>
                <ThreeSixtyIcon />
              </TableCell>
              <TableCell>Servo Move</TableCell>
            </TableRow>
          </Draggable>
        );
      }
    });
    return out;
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  const onDragEnd = result => {
    // dropped outside the list
    console.log(result);
    if (!result.destination) {
      return;
    }

    const items = reorder(
      actions,
      result.source.index,
      result.destination.index
    );

    console.log({
      items,
    });
  };

  return (
    <Box
      elevation={4}
      component={Paper}
      height={"100%"}
      m={1}
      sx={{ overflow: "auto" }}
    >
      <Stack height={"100%"}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={1}>
                  <ImportExportIcon />
                </TableCell>
                <TableCell width={1}>
                  <AccessTimeIcon />
                </TableCell>
                <TableCell width={1}>Type</TableCell>
                <TableCell>X</TableCell>
              </TableRow>
            </TableHead>
            <Droppable droppableId="droppable">
              <TableBody>{makeActions()}</TableBody>
            </Droppable>
          </Table>
        </DragDropContext>
        <BottomNavigation>
          <BottomNavigationAction label="Nearby" icon={<FirstPageIcon />} />
          <BottomNavigationAction label="Recents" icon={<StopIcon />} />
          <BottomNavigationAction label="Favorites" icon={<PlayArrowIcon />} />
        </BottomNavigation>
      </Stack>
    </Box>
  );
};
