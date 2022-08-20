import { Box, IconButton, InputLabel, MenuItem, Tooltip } from "@mui/material";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import React, { useEffect, useRef, useState } from "react";
import { Sequence } from "./Sequence";
import { TwoServos } from "./TwoServos";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import HomeIcon from "@mui/icons-material/Home";
import { Routes, Route } from "react-router-dom";
import { Home } from "./Home";
import { useNavigate } from "react-router-dom";
import { Robot } from "./Robot";

export default function Top() {
  const navigate = useNavigate();

  const [ports, setPorts] = useState([]);
  const [page, setPage] = useState("manual");
  const [selectedPort, setSelectedPort] = useState("");
  const [audioFile, setAudioFile] = useState({ file: null });
  const [sound, setSound] = useState(true);
  const playerRef = useRef(null);

  useEffect(() => {
    window.electron.send("play", "open.mp3");

    window.electron.receive("play_file", file => {
      setAudioFile({ file });
    });
  }, []);

  useEffect(() => {
    if (sound) {
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
        <Tooltip title="Sound On">
          <IconButton
            color="inherit"
            size={"small"}
            onClick={() => soundOn(true)}
          >
            <VolumeOffIcon />
          </IconButton>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Sound Off">
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

  const updatePorts = () => {
    window.electron.send("play", "open_com.mp3");
    window.electron.ipcRenderer
      .invoke("getPorts")
      .then(prts => setPorts(prts))
      .catch(err => console.log(err));
  };

  const openPrt = prt => {
    //console.log(prt);
    window.electron.send("play", "select_com.mp3");
    window.electron.ipcRenderer
      .invoke("openPort", prt)
      .then(res => console.log(res))
      .catch(err => console.log(err));
  };

  const makeBody = () => {
    if (page === "manual") return <TwoServos />;
    else if (page === "sequence") return <Sequence />;
    else return <Box>ERROR</Box>;
  };

  const handleSelectPort = idx => {
    let targetPort = ports[idx];
    openPrt(targetPort.path);
    setSelectedPort(idx);
  };

  const makeNone = () => {
    if (ports.length === 0) {
      return (
        <MenuItem key={"portItemNone"} value={0} disabled>
          No Device Found
        </MenuItem>
      );
    }
  };

  return (
    <Stack height={"100%"}>
      <Stack p={1} direction={"row"} spacing={1}>
        <IconButton color="inherit" onClick={() => navigate("/")}>
          <HomeIcon />
        </IconButton>
        <FormControl fullWidth size={"small"}>
          <InputLabel id="demo-simple-select-label">COM Port</InputLabel>
          <Select
            onOpen={updatePorts}
            onChange={e => handleSelectPort(e.target.value)}
            width={200}
            label={"COM Port"}
            value={selectedPort}
          >
            {makeNone()}
            {ports.map((prt, idx) => (
              <MenuItem key={"portItem" + idx} value={idx}>
                {prt.path}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {makeMute()}
      </Stack>
      <Divider />
      <Box height={"100%"} sx={{ overflow: "auto" }}>
        <Routes>
          <Route path="robot/*" element={<Robot />} />
          <Route path="sequence" element={<Sequence />} />
          <Route path="manual" element={<TwoServos />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Box>
      <audio ref={playerRef} src={"sound://" + audioFile.file} />
    </Stack>
  );
}
