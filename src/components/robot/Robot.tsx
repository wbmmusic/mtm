/**
 * ROBOT OVERVIEW COMPONENT
 *
 * This component displays the main interface for a specific robot configuration,
 * including robot details, sequence management, and assembly instructions.
 * It serves as the primary landing page when a robot is selected.
 *
 * KEY FUNCTIONALITY:
 * - Robot metadata display (name, description, specifications)
 * - Sequence management interface (create, edit, delete sequences)
 * - Assembly instruction video embedding via YouTube
 * - Navigation hub for robot-specific operations
 *
 * DATA FLOW:
 * 1. Extracts robot path from URL parameters
 * 2. Loads robot configuration from storage via IPC
 * 3. Displays robot information and available sequences
 * 4. Provides interface for sequence creation and management
 *
 * ARCHITECTURE:
 * - Uses React Router params to identify which robot to display
 * - Integrates with SequencePicker for sequence management
 * - Embeds YouTube videos for assembly instructions
 * - Handles loading states and error conditions gracefully
 *
 * INTEGRATION POINTS:
 * - Routes: Accessed via /robot/:robotPath URL pattern
 * - Storage: Loads robot data through getRobot helper function
 * - Navigation: Links to sequence editor and other robot tools
 * - Media: Embeds instructional videos when available
 */

// Material-UI components for layout and typography
import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";

// Type definitions and utilities
import type { Robot as RobotType } from "../../types"; // Robot data structure
import { useParams } from "react-router-dom"; // URL parameter extraction
import { getRobot } from "../../helpers"; // Robot data loading

// Child components
import { SequencePicker } from "../sequence/SequencePicker"; // Sequence management interface

// YouTube video embedding
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";

/**
 * ROBOT COMPONENT DEFINITION
 *
 * Main functional component that orchestrates the robot overview interface.
 * Manages robot data loading and provides the primary navigation hub.
 */
export const Robot: React.FC = () => {
  const [robot, setRobot] = useState<RobotType | null>(null);
  const params = useParams<{ robotPath?: string }>();
  const path = params.robotPath ?? "";

  useEffect(() => {
    const run = async () => {
      try {
        const theRobot = await getRobot(path);
        setRobot(theRobot);
      } catch (error) {
        console.error(error);
      }
    };
    run();
  }, [path]);

  if (robot === null)
    return (
      <Box>
        <Typography>Loading ..</Typography>
      </Box>
    );

  return (
    <Box height={"100%"} p={1}>
      <Stack spacing={2}>
        <Typography variant="h5">{robot.name}</Typography>
        <Divider />
        <SequencePicker robot={robot} />
        <Box m={"auto"}>
          <Box component={Paper} p={1} elevation={4}>
            <Typography variant="h6">Assembly Instructions</Typography>
            {(robot.youtubeId ?? "") !== "" ? (
              <LiteYouTubeEmbed
                id={String(robot.youtubeId)}
                title={"Robot assembly video"}
              />
            ) : (
              "No YoutubeID"
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default Robot;
