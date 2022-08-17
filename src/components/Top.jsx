import { Box, InputLabel, MenuItem } from "@mui/material";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import React, { useEffect, useState } from "react";
import { TwoServos } from "./TwoServos";

export default function Top() {
  const [ports, setPorts] = useState([]);

  useEffect(() => {
    window.electron.receive("ports", thePorts => {
      setPorts(thePorts);
    });

    return () => {
      window.electron.removeListener("ports");
    };
  }, []);

  const openPrt = prt => {
    console.log(prt);
    window.electron.ipcRenderer
      .invoke("openPort", prt)
      .then(res => console.log(res))
      .catch(err => console.log(err));
  };

  return (
    <>
      <Stack p={1} direction={"row"}>
        <FormControl fullWidth size={"small"}>
          <InputLabel id="demo-simple-select-label">COM Port</InputLabel>
          <Select
            onChange={e => openPrt(ports[e.target.value].path)}
            width={200}
            label={"COM Port"}
            value={"COM Port"}
          >
            {ports.map((prt, idx) => (
              <MenuItem value={idx}>{prt.path}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Divider />
      <Box height={"100%"} p={1} sx={{ overflow: "auto" }}>
        <TwoServos />
      </Box>
    </>
  );
}
