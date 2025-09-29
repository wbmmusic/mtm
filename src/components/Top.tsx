import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  LinearProgress,
  Modal,
  Tooltip,
  Typography,
} from "@mui/material";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { Sequence } from "./sequence/Sequence";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import HomeIcon from "@mui/icons-material/Home";
import AutoFixNormalIcon from "@mui/icons-material/AutoFixNormal";
import AutoFixOffIcon from "@mui/icons-material/AutoFixOff";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Home } from "./Home";
import { Robot } from "./robot/Robot";
import { GlobalContext } from "../contexts/GlobalContext";
import UsbIcon from "@mui/icons-material/Usb";
import UsbOffIcon from "@mui/icons-material/UsbOff";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { modalStyle } from "../styles";
import { safeReceive, safeRemoveListener, safeInvoke, safeSend } from "../helpers";

type UploadModal = { show: boolean; value: number | null };

export default function Top(): React.ReactElement {
  const navigate = useNavigate();
  const { admin, toggleAdmin, usbConnected } = useContext(GlobalContext);

  const defaultUploadModal: UploadModal = { show: false, value: null };

  const [audioFile, setAudioFile] = useState<{ file: string | null }>({ file: null });
  const [sound, setSound] = useState<boolean>(true);
  const [firmware, setFirmware] = useState<any>(null);
  const [uploadModal, setUploadModal] = useState<UploadModal>(defaultUploadModal);

  const playerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    safeInvoke("getSound")
      .then((res: unknown) => {
        const r = Boolean(res);
        if (r !== sound) setSound(r);
      })
      .catch((err: unknown) => console.error(err));

    safeSend("play", "open.mp3");

    safeReceive("play_file", (file: unknown) => setAudioFile({ file: String(file) }));
    safeReceive("upload_progress", (data: unknown) => setUploadModal(data as UploadModal));
    safeReceive("firmwareAvailable", (latest: unknown) => setFirmware(latest as any));

    return () => {
      safeRemoveListener("play_file");
      safeRemoveListener("firmwareAvailable");
      safeRemoveListener("upload_progress");
    };
  }, [sound]);

  useEffect(() => {
    if (sound && audioFile.file && playerRef.current) {
      playerRef.current.load();
      playerRef.current.play();
    }
  }, [audioFile, sound]);

  const soundOn = (mute: boolean) => {
    safeInvoke("sound", mute).then((res: unknown) => setSound(Boolean(res))).catch(() => {});
  };

  const makeMute = () => {
    if (!sound) {
      return (
        <Tooltip title="Sound">
          <IconButton color="error" size={"small"} onClick={() => soundOn(true)}>
            <VolumeOffIcon />
          </IconButton>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Sound">
          <IconButton color="inherit" size={"small"} onClick={() => soundOn(false)}>
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

  const makeUploadModal = () => {
    return (
      <Modal open={uploadModal.show}>
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Upload Progress
          </Typography>
          <LinearProgress
            sx={{
              "& .MuiLinearProgress-bar": {
                transition: "none",
              },
            }}
            variant={uploadModal.value !== null ? "determinate" : "indeterminate"}
            value={uploadModal.value !== null ? uploadModal.value : undefined}
          />
        </Box>
      </Modal>
    );
  };

  return (
    <Stack height={"100%"}>
      <Stack p={1} direction={"row"} spacing={1} sx={{ backgroundColor: admin ? "salmon" : "paleTurquoise" }}>
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
            <Tooltip title="Update Firmware" onClick={() => safeSend("uploadFirmware") }>
              <FileUploadIcon />
            </Tooltip>
          </IconButton>
        ) : null}
        {makeMute()}
        {makeAdminMode()}
        {makeUploadModal()}
      </Stack>
      <Divider />
      <Box height={"100%"} sx={{ overflow: "auto" }}>
        <Routes>
          <Route path="robot/:robotPath" element={<Robot />} />
          <Route path="sequence/:robotPath/:sequenceId" element={<Sequence />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Box>
      {audioFile.file ? <audio ref={playerRef} src={"sound://" + audioFile.file} /> : null}
    </Stack>
  );
}

