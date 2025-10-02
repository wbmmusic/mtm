/**
 * ROBOT CARD COMPONENT
 *
 * A comprehensive card interface for displaying and managing individual robot
 * configurations in the robot selection grid. Provides visual overview and
 * quick access to robot management functions.
 *
 * KEY FEATURES:
 * - Robot metadata display (name, description, difficulty rating)
 * - Visual robot icon with connected/disconnected state indication
 * - Administrative controls (edit, delete, export) for robot management
 * - Navigation to robot-specific interfaces and sequence editors
 * - Import/export functionality for robot configuration sharing
 *
 * ADMINISTRATIVE FEATURES:
 * - Edit robot configuration and metadata
 * - Delete robot with confirmation dialog
 * - Export robot configuration for sharing or backup
 * - Access restricted based on admin status from GlobalContext
 *
 * VISUAL DESIGN:
 * - Material-UI Paper component for card elevation and styling
 * - Robot difficulty rating display with star system
 * - Color-coded connection status indicators
 * - Responsive button layout for different actions
 *
 * INTEGRATION POINTS:
 * - GlobalContext: Admin permissions and app state
 * - Navigation: Routes to robot-specific pages
 * - IPC: Robot export functionality via main process
 * - Parent components: Modal state management for edit/delete operations
 */

import React, { useContext } from "react";

// Material-UI icons for robot representation
import SmartToyIcon from "@mui/icons-material/SmartToy"; // Connected robot icon
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined"; // Disconnected robot icon

// Material-UI components for layout and controls
import {
  Box, // Container component
  Button, // Action buttons
  Divider, // Visual separators
  Paper, // Card container with elevation
  Rating, // Star rating display
  Stack, // Flex layout container
  Typography, // Text components
} from "@mui/material";

// Navigation and state management
import { useNavigate } from "react-router-dom"; // React Router navigation
import { GlobalContext } from "../../contexts/GlobalContext"; // Global app state
import { safeInvoke } from "../../helpers"; // IPC communication wrapper

// Type definitions
import { Robot } from "../../types"; // Robot data structure

/**
 * COMPONENT PROPS INTERFACE
 *
 * Defines the props required for robot card functionality,
 * including robot data and callback functions for state management.
 */
interface RobotCardProps {
  robot: Robot; // Robot configuration data
  setDelete: (arg: { show: boolean; robot?: Robot | null }) => void; // Delete modal control
  setRobot: (arg: {
    mode: "new" | "edit" | null;
    robot?: Robot | null;
  }) => void; // Edit modal control
}

export const RobotCard: React.FC<RobotCardProps> = ({
  robot,
  setDelete,
  setRobot,
}) => {
  const navigate = useNavigate();
  const { admin } = useContext(GlobalContext) as { admin?: boolean };

  const Buttons: React.FC<{ robot: Robot }> = ({ robot }) => (
    <Stack direction="row-reverse" spacing={1}>
      <Button
        variant="contained"
        color="error"
        onClick={() => setDelete({ show: true, robot })}
      >
        Delete
      </Button>
      <Button
        variant="contained"
        onClick={() => setRobot({ mode: "edit", robot })}
      >
        Edit
      </Button>
      <Button
        variant="contained"
        onClick={() => {
          safeInvoke("exportRobot", robot.path ?? "")
            .then(() => console.log("export requested"))
            .catch(err => console.error(err));
        }}
      >
        Export
      </Button>
    </Stack>
  );

  return (
    <Box p={1} component={Paper} elevation={2}>
      <Box
        sx={{ cursor: "pointer" }}
        onClick={() => navigate("/robot/" + robot.path)}
      >
        <Stack direction="row" width={{}} spacing={3} alignItems="center">
          <Typography
            variant="h5"
            sx={{
              whiteSpace: "nowrap",
              fontSize: "16px", // Explicit size for consistency
              fontWeight: "bold",
            }}
          >
            {robot.name}
          </Typography>
          <Box width={"100%"} />
          <Rating
            icon={<SmartToyIcon />}
            emptyIcon={<SmartToyOutlinedIcon />}
            max={3}
            value={robot.difficulty}
            readOnly
          />
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "nowrap",
              fontSize: "12px", // Increased from 9px for better readability
              fontFamily: "Bit, monospace", // Use more readable font
            }}
          >
            Servos: {robot.servos ? robot.servos.length : 0}
          </Typography>
        </Stack>
        <Divider />
        <Stack direction="row">
          <Box>
            <Box
              component="img"
              sx={{ maxHeight: "100%", maxWidth: "100px" }}
              src="/images/robot.png"
            />
          </Box>
          <Box
            m={1}
            p={1}
            width={"100%"}
            component={Paper}
            color="black"
            sx={{
              backgroundColor: "#BBCC00",
              fontFamily: "Arcade",
              fontSize: "26px",
              lineHeight: "80%",
              border: "5px solid",
              borderRadius: "3px",
            }}
          >
            {robot.description ?? ""}
          </Box>
        </Stack>
      </Box>
      {admin ? <Buttons robot={robot} /> : null}
    </Box>
  );
};

export default RobotCard;
