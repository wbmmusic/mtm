import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import React from "react";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

const SequenceCard = ({ sequence }) => {
  <Box>
    <Stack>
      <Typography>{sequence.name}</Typography>
    </Stack>
  </Box>;
};

export const SequencePicker = ({ robot }) => {
  const navigate = useNavigate();
  const newSequence = () =>
    navigate(`/sequence/${robot.path}/newsequenceplaceholder`);

  const NewSequence = () => (
    <Box component={Paper} p={1} elevation={4}>
      <Tooltip title="New Sequence">
        <IconButton color="inherit" onClick={newSequence}>
          <AddIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box p={1} component={Paper} elevation={4}>
      <Typography variant="h6">Sequences</Typography>
      <Box width={"100%"}>
        <Stack direction="row">
          {robot.sequences.map((sequence, idx) => (
            <SequenceCard key={"sequence" + idx} sequence={sequence} />
          ))}
          <NewSequence />
        </Stack>
      </Box>
    </Box>
  );
};
