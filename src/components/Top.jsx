import { Box, IconButton, Tooltip } from "@mui/material";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Sequence } from "./sequence/Sequence";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import HomeIcon from "@mui/icons-material/Home";
import AutoFixNormalIcon from "@mui/icons-material/AutoFixNormal";
import AutoFixOffIcon from "@mui/icons-material/AutoFixOff";
import { Routes, Route } from "react-router-dom";
import { Home } from "./Home";
import { useNavigate } from "react-router-dom";
import { Robot } from "./robot/Robot";
import { GlobalContext } from "../contexts/GlobalContext";
import UsbIcon from "@mui/icons-material/Usb";
import UsbOffIcon from "@mui/icons-material/UsbOff";
import FileUploadIcon from "@mui/icons-material/FileUpload";

//delete me

export default function Top() {
  const navigate = useNavigate();
  const { admin, toggleAdmin, usbConnected } = useContext(GlobalContext);

  const [audioFile, setAudioFile] = useState({ file: null });
  const [sound, setSound] = useState(true);
  const [firmware, setFirmware] = useState(null);
  const playerRef = useRef(null);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke("getSound")
      .then(res => {
        if (res !== sound) setSound(res);
      })
      .catch(err => console.error(err));

    window.electron.send("play", "open.mp3");

    window.electron.receive("play_file", file => setAudioFile({ file }));

    window.electron.receive("firmwareAvailable", latest => {
      console.log("Latest Firmware", latest);
      setFirmware(latest);
    });

    return () => {
      window.electron.removeListener("play_file");
      window.electron.removeListener("firmwareAvailable");
    };
  }, []);

  useEffect(() => {
    if (sound && audioFile.file) {
      playerRef.current.load();
      playerRef.current.play();
    }
  }, [audioFile]);

  const soundOn = mute => {
    window.electron.ipcRenderer
      .invoke("sound", mute)
      .then(res => setSound(res));
  };

  const makeMute = () => {
    if (!sound) {
      return (
        <Tooltip title="Sound">
          <IconButton
            color="error"
            size={"small"}
            onClick={() => soundOn(true)}
          >
            <VolumeOffIcon />
          </IconButton>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Sound">
          <IconButton
            color="inherit"
            size={"small"}
            onClick={() => soundOn(false)}
          >
            <VolumeUpIcon />
          </IconButton>
        </Tooltip>
      );
    }
  };

  const makeAdminMode = () => {
    if (admin) {
      return (
        <Tooltip title="Leave Admin Mode">
          <IconButton color="inherit" size={"small"} onClick={toggleAdmin}>
            <AutoFixOffIcon />
          </IconButton>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Enter Admin Mode">
          <IconButton color="inherit" size={"small"} onClick={toggleAdmin}>
            <AutoFixNormalIcon />
          </IconButton>
        </Tooltip>
      );
    }
  };

  return (
    <Stack height={"100%"}>
      <Stack
        p={1}
        direction={"row"}
        spacing={1}
        sx={{ backgroundColor: admin ? "salmon" : "paleTurquoise" }}
      >
        <IconButton size="small" color="inherit" onClick={() => navigate("/")}>
          <HomeIcon />
        </IconButton>
        <Box width={"100%"}>
          {usbConnected ? (
            <IconButton size="small" disabled>
              <UsbIcon color="success" />
            </IconButton>
          ) : (
            <IconButton size="small" disabled>
              <UsbOffIcon color="error" />
            </IconButton>
          )}
        </Box>
        {!firmware ? (
          <IconButton size="small" color="inherit">
            <Tooltip
              title="Update Firmware"
              onClick={() => window.electron.send("uploadFirmware")}
            >
              <FileUploadIcon />
            </Tooltip>
          </IconButton>
        ) : null}
        {makeMute()}
        {makeAdminMode()}
      </Stack>
      <Divider />
      <Box height={"100%"} sx={{ overflow: "auto" }}>
        <Routes>
          <Route path="robot/:robotPath" element={<Robot />} />
          <Route
            path="sequence/:robotPath/:sequenceId"
            element={<Sequence />}
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </Box>
      {audioFile.file ? (
        <audio ref={playerRef} src={"sound://" + audioFile.file} />
      ) : null}
    </Stack>
  );
}
