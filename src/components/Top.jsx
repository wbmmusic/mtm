import { Box, Button, InputLabel, MenuItem } from "@mui/material";
import ButtonGroup from "@mui/material/ButtonGroup";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import React, { useEffect, useState } from "react";
import { Sequence } from "./Sequence";
import { TwoServos } from "./TwoServos";

export default function Top() {
  const [ports, setPorts] = useState([]);
  const [page, setPage] = useState("manual");
  const [selectedPort, setSelectedPort] = useState("");
  //
  useEffect(() => {
    window.electron.receive("ports", thePorts => setPorts(thePorts));

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

  const makeBody = () => {
    if (page === "manual") return <TwoServos />;
    else if (page === "sequence") return <Sequence />;
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
        <FormControl fullWidth size={"small"}>
          <InputLabel id="demo-simple-select-label">COM Port</InputLabel>
          <Select
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
        <ButtonGroup variant="contained">
          <Button
            onClick={() => setPage("manual")}
            color={page === "manual" ? "success" : "primary"}
          >
            Manual
          </Button>
          <Button
            onClick={() => setPage("sequence")}
            color={page === "sequence" ? "success" : "primary"}
          >
            sequence
          </Button>
        </ButtonGroup>
      </Stack>
      <Divider />
      <Box height={"100%"} sx={{ overflow: "hidden" }}>
        {makeBody()}
      </Box>
    </Stack>
  );
}
