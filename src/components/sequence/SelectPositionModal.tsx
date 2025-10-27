import {
  Button,
  IconButton,
  Modal,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import { Position as PositionType } from "../../types";
import { modalStyle } from "../../styles";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";

export const SelectPositionModal: React.FC<{
  out: (t: string, d?: PositionType) => void;
  positions: PositionType[];
}> = ({ out, positions }) => {
  return (
    <Modal
      open={true}
      onClose={() => out("cancel")}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle} component={Paper}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Select Position to edit
        </Typography>
        <Stack spacing={1}>
          {positions.map((position, idx) => (
            <Box
              key={"positionCard" + idx}
              p={1}
              component={Paper}
              elevation={4}
            >
              <Stack direction="row" spacing={1}>
                <Typography sx={{ whiteSpace: "nowrap" }}>
                  {position.name}
                </Typography>
                <Box width={"100%"} />
                <Tooltip
                  title="Edit"
                  placement="left"
                  onClick={() => out("edit", position)}
                >
                  <IconButton color="inherit" size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Delete"
                  placement="left"
                  onClick={() => out("delete", position)}
                >
                  <IconButton color="error" size="small">
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          ))}
          <Stack direction="row-reverse">
            <Button variant="contained" onClick={() => out("cancel")}>
              Close
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
};
