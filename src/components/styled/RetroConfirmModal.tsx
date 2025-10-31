/**
 * RETRO CONFIRMATION MODAL COMPONENT
 *
 * A themed replacement for native browser confirmation dialogs (window.confirm).
 * Provides consistent visual styling with the application's retro aesthetic
 * while offering enhanced customization and accessibility features.
 *
 * KEY FEATURES:
 * - Custom retro styling with pixel fonts and themed colors
 * - Configurable button text and modal title
 * - Danger mode for destructive actions (red styling)
 * - Backdrop click prevention to ensure user interaction
 * - Accessibility-compliant with ARIA labels and keyboard navigation
 * - Consistent with overall application design language
 *
 * USAGE PATTERNS:
 * - Sequence deletion confirmation
 * - Position removal confirmation
 * - Timeline clearing confirmation
 * - Any destructive action requiring user verification
 *
 * DESIGN RATIONALE:
 * Native browser dialogs don't match the application's retro aesthetic
 * and cannot be styled. This component provides the same functionality
 * while maintaining visual consistency and offering better UX control.
 */

import React from "react";
import { Box, Modal, Stack, Typography } from "@mui/material";
import { RetroModalContent, RetroButton, DangerButton } from "./index";

/**
 * COMPONENT PROPS INTERFACE
 *
 * Defines all configurable properties for the confirmation modal,
 * providing flexibility while maintaining sensible defaults.
 */
interface RetroConfirmModalProps {
  open: boolean; // Controls modal visibility
  title?: string; // Optional custom title (defaults to "Confirm Action")
  message: string; // Main confirmation message to display
  confirmText?: string; // Custom confirm button text (defaults to "Yes")
  cancelText?: string; // Custom cancel button text (defaults to "Cancel")
  onConfirm: () => void; // Callback for confirm action
  onCancel: () => void; // Callback for cancel action
  danger?: boolean; // Enables danger styling for destructive actions
}

export const RetroConfirmModal: React.FC<RetroConfirmModalProps> = ({
  open,
  title = "Confirm Action",
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    // Prevent closing on backdrop click for confirmation modals
    event.stopPropagation();
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      onClick={handleBackdropClick}
      aria-labelledby="retro-confirm-title"
      aria-describedby="retro-confirm-description"
    >
      <RetroModalContent>
        <Stack spacing={2}>
          <Typography
            id="retro-confirm-title"
            variant="h5"
            component="h2"
            sx={{
              fontFamily: "Arcade, monospace",
              textAlign: "center",
              color: danger ? "#ff4444" : "#32cd32", // red for danger, lime for normal
              textShadow: "1px 1px #000000",
            }}
          >
            {title}
          </Typography>

          <Typography
            id="retro-confirm-description"
            variant="body1"
            sx={{
              fontFamily: "Bit, monospace",
              textAlign: "center",
              color: "#000000",
              backgroundColor: "#d3d3d3",
              padding: 2,
              border: "2px solid #55533c",
              minHeight: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {message}
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <RetroButton
              variant="contained"
              onClick={handleCancel}
              sx={{
                minWidth: "100px",
                backgroundColor: "#d3d3d3", // light grey background
                color: "#000000", // black text for readability
                border: "2px solid #55533c",
                "&:hover": {
                  backgroundColor: "#c0c0c0", // darker grey on hover
                  color: "#000000",
                },
              }}
            >
              {cancelText}
            </RetroButton>

            {danger ? (
              <DangerButton
                variant="contained"
                onClick={handleConfirm}
                sx={{
                  minWidth: "100px",
                }}
              >
                {confirmText}
              </DangerButton>
            ) : (
              <RetroButton
                variant="contained"
                onClick={handleConfirm}
                sx={{
                  minWidth: "100px",
                  backgroundColor: "#32cd32", // lime green
                  "&:hover": {
                    backgroundColor: "#228b22",
                  },
                }}
              >
                {confirmText}
              </RetroButton>
            )}
          </Stack>
        </Stack>
      </RetroModalContent>
    </Modal>
  );
};

export default RetroConfirmModal;
