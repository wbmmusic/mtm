import { Button, Modal, Paper, Stack, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import { modalStyle } from "../../styles";

export const SelectPositionModal = ({ out, positions }) => {
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
          {positions.map(position => (
            <Box
              sx={{ cursor: "pointer" }}
              p={1}
              component={Paper}
              elevation={4}
              onClick={() => out("edit", position)}
            >
              <Typography>{position.name}</Typography>
            </Box>
          ))}
          <Stack direction="row-reverse">
            <Button size="small" onClick={() => out("cancel")}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
};
