import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { SequencePicker } from "./SequencePicker";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { useParams } from "react-router-dom";

export const Robot = () => {
  const [robot, setRobot] = useState(null);
  const path = useParams().robotPath;

  const getRobot = () => {
    window.electron.ipcRenderer
      .invoke("getRobot", path)
      .then(res => setRobot(res))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    getRobot();
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
