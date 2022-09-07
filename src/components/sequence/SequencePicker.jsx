import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import React from "react";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

export const SequencePicker = ({ robot }) => {
  const navigate = useNavigate();
  const newSequence = () =>
    navigate(`/sequence/${robot.path}/newsequenceplaceholder`);

  const editSequence = sequence => {
    navigate(`/sequence/${robot.path}/${sequence.appId}`);
  };

  const SequenceCard = ({ sequence }) => (
    <Box
      sx={{ cursor: "pointer" }}
      component={Paper}
      elevation={2}
      p={1}
      onClick={() => editSequence(sequence)}
    >
      <Stack>
        <Typography>{sequence.name}</Typography>
      </Stack>
    </Box>
  );

  const NewSequence = () => (
    <Box component={Paper} p={1} elevation={2}>
      <Tooltip title="New Sequence">
        <IconButton size="large" color="inherit" onClick={newSequence}>
          <AddIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box p={1} component={Paper} elevation={4}>
      <Typography variant="h6">Sequences</Typography>
      <Box width={"100%"}>
        <Stack direction="row" spacing={1}>
          {robot.sequences.map((seq, idx) => (
            <SequenceCard key={"sequence" + idx} sequence={seq} />
          ))}
          <NewSequence />
        </Stack>
      </Box>
    </Box>
  );
};
