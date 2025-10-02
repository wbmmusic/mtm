// EXAMPLE: How the Sequence component could be refactored

import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import { 
  RetroTitle, 
  PixelText, 
  RetroButton, 
  DangerButton,
  RetroTextField,
  DroppableContainer,
  SectionContainer,
  HeaderBar,
  RetroConfirmModal 
} from '../styled';

// Instead of this scattered approach with native dialogs:
/*
<Stack direction="row" spacing={1} p={1} bgcolor="orange">
  <TextField sx={{ width: "100%" }} label="Sequence Name" />
  <Button color="error" size="small" onClick={() => {
    if (window.confirm("Are you sure you want to clear the timeline?")) {
      // Clear timeline action
    }
  }}>
    Clear Timeline
  </Button>
</Stack>

// Old approach problems:
// - Native browser dialogs don't match retro theme
// - Scattered inline styling
// - Hardcoded colors and spacing
*/

// New clean approach with RetroConfirmModal:
export const SequenceHeaderExample = () => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearConfirm = () => {
    // Clear timeline logic here
    console.log('Timeline cleared!');
    setShowClearConfirm(false);
  };

  return (
    <>
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
          <DangerButton 
            size="small" 
            onClick={() => setShowClearConfirm(true)}
          >
            Clear Timeline
          </DangerButton>
        </Stack>
      </HeaderBar>
      
      <RetroConfirmModal
        open={showClearConfirm}
        title="Clear Timeline"
        message="Are you sure you want to clear the timeline? This will remove all actions from your sequence."
        confirmText="Clear"
        cancelText="Cancel"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        danger={true}
      />
    </>
  );
};

export const TimelineSectionExample = () => (
  <SectionContainer>
    <RetroTitle variant="h6">MY SEQUENCE</RetroTitle>
    <DroppableContainer>
      {/* Droppable content here */}
      <PixelText>Drag items here...</PixelText>
    </DroppableContainer>
  </SectionContainer>
);