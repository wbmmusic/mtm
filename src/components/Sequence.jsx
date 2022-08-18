import TimerIcon from "@mui/icons-material/Timer";
import ThreeSixtyIcon from "@mui/icons-material/ThreeSixty";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { Stack, TableContainer, TextField, Typography } from "@mui/material";
import { Transport } from "./Transport";

// ドラッグ&ドロップした要素を入れ替える
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// ドラッグ&ドロップの質問のスタイル
const getItemStyle = (isDragging, draggableStyle) => ({
  background: isDragging ? "#757ce8" : "white",
  ...draggableStyle,
});
// ドラッグ&ドロップのリストのスタイル
// const getListStyle = (isDraggingOver) => ({
//   background: isDraggingOver ? "#1769aa" : "lightgrey",
//   padding: "10px"
//  });

export const Sequence = () => {
  const [actions, actionssetActions] = useState([
    { id: 1, type: "delay", note: "Wait to start", value: 1000 },
    { id: 2, type: "move", note: "Move to position 1" },
    { id: 3, type: "delay", note: "Wait for next move", value: 3000 },
    { id: 4, type: "move", note: "Move to position 2" },
    { id: 5, type: "delay", note: "Wait for next move", value: 520 },
    { id: 6, type: "move", note: "Move to position 3" },
  ]);

  const handleDelayChange = (newValue, idx) => {
    let tempActions = JSON.parse(JSON.stringify(actions));
    tempActions[idx].value = parseInt(newValue);
    actionssetActions(tempActions);
  };

  const onDragEnd = result => {
    // ドロップ先がない
    if (!result.destination) {
      return;
    }
    // 配列の順序を入れ替える
    let movedItems = reorder(
      actions, //　順序を入れ変えたい配列
      result.source.index, // 元の配列の位置
      result.destination.index // 移動先の配列の位置
    );
    actionssetActions(movedItems);
  };

  const makeEventTime = idx => {
    let startTime = 0;

    for (let i = 0; i < idx; i++) {
      if (actions[i].type === "delay") {
        startTime = startTime + actions[i].value;
      }
    }

    return <Typography>{startTime / 1000}</Typography>;
  };

  const makeRowContents = (question, idx) => {
    if (question.type === "delay") {
      return (
        <>
          <TableCell>
            <Box sx={{ cursor: "grab" }}>
              <DragHandleIcon />
            </Box>
          </TableCell>
          <TableCell>{makeEventTime(idx)}</TableCell>
          <TableCell>
            <TimerIcon />
          </TableCell>
          <TableCell>
            <TextField
              label="delay ms"
              variant="standard"
              size="small"
              value={question.value}
              type="number"
              onChange={e => handleDelayChange(e.target.value, idx)}
            />
          </TableCell>
          <TableCell>
            <Typography>{question.note}</Typography>
          </TableCell>
        </>
      );
    } else if (question.type === "move") {
      return (
        <>
          <TableCell>
            <Box sx={{ cursor: "grab" }}>
              <DragHandleIcon />
            </Box>
          </TableCell>
          <TableCell>{makeEventTime(idx)}</TableCell>
          <TableCell>
            <ThreeSixtyIcon />
          </TableCell>
          <TableCell sx={{ whiteSpace: "nowrap" }}>Servo Move</TableCell>
          <TableCell>
            <Typography>{question.note}</Typography>
          </TableCell>
        </>
      );
    }
  };

  return (
    <Box p={1} height={"100%"}>
      <Stack height={"100%"} sx={{ overflow: "hidden" }}>
        <Box height={"100%"} sx={{ overflow: "auto" }} p={1}>
          <TableContainer component={Paper} sx={{ maxHeight: "100%" }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell width={1}>
                    <ImportExportIcon />
                  </TableCell>
                  <TableCell width={1}>
                    <AccessTimeIcon />
                  </TableCell>
                  <TableCell width={1}>
                    <Typography>Type</Typography>
                  </TableCell>
                  <TableCell width={1}>
                    <Typography>Parameter</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography>Note</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              {/* <TableBody> */}
              {/*ドラッグアンドドロップの有効範囲 */}
              <DragDropContext onDragEnd={onDragEnd}>
                {/* ドロップできる範囲 */}
                <Droppable droppableId="droppable">
                  {(provided, snapshot) => (
                    <TableBody
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      // style={getListStyle(snapshot.isDraggingOver)}
                    >
                      {/*　ドラッグできる要素　*/}
                      {actions.map((question, index) => (
                        <Draggable
                          key={question.id}
                          draggableId={"q-" + question.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={getItemStyle(
                                snapshot.isDragging,
                                provided.draggableProps.style
                              )}
                            >
                              {makeRowContents(question, index)}
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </DragDropContext>
              {/* </TableBody> */}
            </Table>
          </TableContainer>
        </Box>
        <Transport />
      </Stack>
    </Box>
  );
};
