import { Box, Button, Modal, Stack, Typography } from "@mui/material";
import React from "react";
import { modalStyle } from "../../styles";

export const ConfirmDeletePositionModal = ({ out, position }) => {
  return (
    <Modal
      open={true}
      onClose={() => out("cancel")}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Confirm Delete Position
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          Are you sure you want to delete position named <b>{position.name}</b>
        </Typography>
        <Stack direction="row-reverse" spacing={1}>
          <Button variant="contained" onClick={() => out("cancel")}>
            cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => out("delete")}
          >
            Delete
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};
