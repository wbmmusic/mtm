import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import FirstPageIcon from "@mui/icons-material/FirstPage";

import { Box } from "@mui/material";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Stack from "@mui/material/Stack";
import React from "react";

export const Sequence = () => {
  return (
    <Box height={"100%"} sx={{ overflow: "auto" }}>
      <Stack height={"100%"} sx={{ backgroundColor: "red" }}>
        <Box>Text</Box>
        <Box height={"100%"}>DUMMY</Box>
        <BottomNavigation>
          <BottomNavigationAction label="Nearby" icon={<FirstPageIcon />} />
          <BottomNavigationAction label="Recents" icon={<StopIcon />} />
          <BottomNavigationAction label="Favorites" icon={<PlayArrowIcon />} />
        </BottomNavigation>
      </Stack>
    </Box>
  );
};
