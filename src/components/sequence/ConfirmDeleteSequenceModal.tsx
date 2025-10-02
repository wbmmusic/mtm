import { Modal, Stack, Typography } from "@mui/material";
import React from "react";
import { RetroModalContent, RetroTitle, DangerButton, RetroButton, PixelText } from "../styled";

export const ConfirmDeleteSequenceModal: React.FC<{ name: string | null; out: (t: string) => void }> = ({ name, out }) => {
  return (
    <Modal open={true} onClose={() => out("cancel")} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
      <RetroModalContent>
        <RetroTitle id="modal-modal-title" variant="h6">
          Confirm Delete Modal
        </RetroTitle>
        <Typography id="modal-modal-description" sx={{ mt: 2, fontFamily: 'Bit, monospace' }}>
          Are you sure you want to delete the sequence <b>{name ?? ""}</b>?
        </Typography>
        <Stack direction="row-reverse" spacing={1} sx={{ mt: 2 }}>
          <DangerButton size="small" onClick={() => out("delete")}>
            Delete
          </DangerButton>
          <RetroButton size="small" onClick={() => out("cancel")}>
            Cancel
          </RetroButton>
        </Stack>
      </RetroModalContent>
    </Modal>
  );
};
