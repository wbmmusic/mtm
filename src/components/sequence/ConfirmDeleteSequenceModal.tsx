import { Box, Button, Modal, Stack, Typography } from "@mui/material";
import React from "react";
import { modalStyle } from "../../styles";

export const ConfirmDeleteSequenceModal: React.FC<{ name: string | null; out: (t: string) => void }> = ({ name, out }) => {
  return (
    <Modal open={true} onClose={() => out("cancel")} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Confirm Delete Modal
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          Are you sure you want to delete the sequence <b>{name ?? ""}</b>?
        </Typography>
        <Stack direction="row-reverse">
          <Button color="error" size="small" onClick={() => out("delete")}>
            Delete
          </Button>
          <Button size="small" onClick={() => out("cancel")}>
            Cancel
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};
