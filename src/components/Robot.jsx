import { Box, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { SequencePicker } from "./SequencePicker";

export const Robot = () => {
  return (
    <Box height={"100%"} p={1}>
      <Stack spacing={2}>
        <Typography variant="h4">Robot Name</Typography>
        <Box m={"auto"}>
          <Box component={Paper}>
            <Typography>Assembly Instructions</Typography>
            <iframe
              src="https://www.youtube.com/embed/geFE9Ng5KRg"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </Box>
        </Box>
        <SequencePicker />
      </Stack>
    </Box>
  );
};
