import React, { useContext } from "react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import {
  Box,
  Button,
  Divider,
  Paper,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../../contexts/GlobalContext";

export const RobotCard = ({ robot, setDelete, setRobot }) => {
  const navigate = useNavigate();
  const { admin } = useContext(GlobalContext);

  const Buttons = ({ robot }) => (
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
          window.electron.ipcRenderer
            .invoke("exportRobot", robot.path)
            .then(res => console.log(res))
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
        <Stack direction="row" width={"100%"} spacing={3} alignItems="center">
          <Typography variant="h6" sx={{ whiteSpace: "nowrap" }}>
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
          <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
            Servos: {robot.servos.length}
          </Typography>
        </Stack>
        <Divider />
        <Stack direction="row">
          <Box>
            <Box
              component="img"
              sx={{ maxHeight: "100%", maxWidth: "100px" }}
              src="img://robot.png"
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
            {robot.description}
          </Box>
        </Stack>
      </Box>
      {admin ? <Buttons robot={robot} /> : null}
    </Box>
  );
};
