/**
 * SERVO INPUT COMPONENT
 *
 * A specialized input component for configuring individual servo motors in the robot setup.
 * This component provides a user-friendly interface for naming servos and managing the
 * servo configuration during robot setup or editing.
 *
 * CORE FUNCTIONALITY:
 * - Servo name editing with real-time updates
 * - Visual servo index display for user reference
 * - Servo deletion with confirmation (trash button)
 * - Input validation and error handling
 *
 * TECHNICAL DETAILS:
 * - Controlled component pattern with parent state management
 * - Uses Material-UI TextField for consistent styling
 * - Includes tooltip guidance for user experience
 * - Paper container provides visual grouping and elevation
 *
 * INTEGRATION:
 * - Used in robot configuration interfaces
 * - Connects to parent components for servo list management
 * - Updates are propagated through callback functions
 * - Deletion triggers parent state updates and re-rendering
 *
 * DATA FLOW:
 * 1. Receives servo data and callbacks from parent component
 * 2. Displays current servo name and index in UI
 * 3. Propagates name changes through update callback
 * 4. Triggers deletion through trash callback when requested
 */

import React from "react";
// Material-UI components for input and layout
import { IconButton, Paper, Stack, TextField, Tooltip } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear"; // Delete icon

// Type definitions
import type { Servo } from "../../types"; // Servo data structure

/**
 * COMPONENT PROPS INTERFACE
 *
 * Defines the props required for servo input functionality,
 * including servo data and callback functions for state management.
 */
interface ServoInputProps {
  servo: Servo; // Current servo data (name, enabled, value, etc.)
  index: number; // Servo index for display (0-based, shown as 1-based)
  update: (name: string) => void; // Callback to update servo name
  trash: () => void; // Callback to delete this servo
}

export const ServoInput: React.FC<ServoInputProps> = ({
  servo,
  index,
  update,
  trash,
}) => {
  return (
    <Stack direction="row" spacing={1} component={Paper} p={1}>
      <TextField
        label={`Servo ${index + 1} Name`}
        variant="standard"
        size="small"
        value={servo.name}
        onChange={e => update((e.target as HTMLInputElement).value)}
      />
      <Tooltip placement="left" title="Delete Servo">
        <IconButton color="error" onClick={trash}>
          <ClearIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default ServoInput;
