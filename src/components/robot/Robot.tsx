import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import type { Robot as RobotType } from "../../types";
import { SequencePicker } from "../sequence/SequencePicker";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { useParams } from "react-router-dom";
import { getRobot } from "../../helpers";

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
