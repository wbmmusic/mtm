import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import TimerIcon from "@mui/icons-material/Timer";
import ThreeSixtyIcon from "@mui/icons-material/ThreeSixty";

import { Box, Table, TableBody, TableCell, TableRow } from "@mui/material";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Stack from "@mui/material/Stack";
import React, { useState } from "react";

export const Sequence = () => {
  const [actions, setActions] = useState([]);

  return (
    <Box height={"100%"} sx={{ overflow: "auto" }}>
      <Stack height={"100%"}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <TimerIcon />
              </TableCell>
              <TableCell>Delay X sec</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <ThreeSixtyIcon />
              </TableCell>
              <TableCell>Set Servo</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <BottomNavigation>
          <BottomNavigationAction label="Nearby" icon={<FirstPageIcon />} />
          <BottomNavigationAction label="Recents" icon={<StopIcon />} />
          <BottomNavigationAction label="Favorites" icon={<PlayArrowIcon />} />
        </BottomNavigation>
      </Stack>
    </Box>
  );
};
