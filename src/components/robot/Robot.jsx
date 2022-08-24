import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { SequencePicker } from "../sequence/SequencePicker";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { useParams } from "react-router-dom";
import { getRobot } from "../../helpers";

export const Robot = () => {
  const [robot, setRobot] = useState(null);
  const path = useParams().robotPath;

  const setTheRobot = async () => {
    try {
      const theRobot = await getRobot(path);
      setRobot(theRobot);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setTheRobot();
  }, []);

  if (robot === null)
    return (
      <Box>
        <Typography>Loading ..</Typography>
      </Box>
    );

  return (
    <Box height={"100%"} p={1}>
      <Stack spacing={2}>
        <Typography variant="h4">{robot.name}</Typography>
        <Divider />
        <SequencePicker robot={robot} />
        <Box m={"auto"}>
          <Box component={Paper} p={1} elevation={4}>
            <Typography variant="h6">Assembly Instructions</Typography>
            {robot.youtubeId !== "" ? (
              <LiteYouTubeEmbed
                id={robot.youtubeId}
                title="What’s new in Material Design for the web (Chrome Dev Summit 2019)"
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
