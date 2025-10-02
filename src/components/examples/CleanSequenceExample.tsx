// EXAMPLE: How the Sequence component could be refactored

import React from 'react';
import { Stack, Box } from '@mui/material';
import { 
  RetroTitle, 
  PixelText, 
  RetroButton, 
  DangerButton,
  RetroTextField,
  DroppableContainer,
  SectionContainer,
  HeaderBar 
} from '../styled';

// Instead of this scattered approach:
/*
<Stack direction="row" width={"100vw"} spacing={1} p={1} bgcolor="orange">
  <Box width={"100%"}>
    <TextField sx={{ width: "100%" }} label="Sequence Name" error={sequence.name === ""} size="small" variant="standard" value={sequence.name} onChange={(e) => setSequence((old: any) => ({ ...old, name: e.target.value }))} />
  </Box>
  <Box>
    <Button color="error" size="small" onClick={() => {
      if (window.confirm("Are you sure you want to clear the timeline?")) {
        setSequence((old) => (old ? { ...old, actions: [] } : old));
      }
    }}>
      Clear Timeline
    </Button>
  </Box>
</Stack>
*/

// You could have this clean approach:
export const SequenceHeaderExample = () => (
  <HeaderBar>
    <Stack direction="row" spacing={1} alignItems="center">
      <RetroTextField 
        label="Sequence Name" 
        size="small" 
        fullWidth
        // error={sequence.name === ""}
        // value={sequence.name} 
        // onChange={(e) => setSequence((old: any) => ({ ...old, name: e.target.value }))}
      />
      <DangerButton size="small">
        Clear Timeline
      </DangerButton>
    </Stack>
  </HeaderBar>  
);

export const TimelineSectionExample = () => (
  <SectionContainer>
    <RetroTitle variant="h6">MY SEQUENCE</RetroTitle>
    <DroppableContainer>
      {/* Droppable content here */}
      <PixelText>Drag items here...</PixelText>
    </DroppableContainer>
  </SectionContainer>
);