import { styled } from '@mui/material/styles';
import { Typography, Button, TextField, Box } from '@mui/material';

// Styled Typography Components
export const RetroTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Arcade, monospace',
  fontWeight: 'bold',
  color: theme.palette.text.primary,
  textShadow: '1px 1px 0px magenta',
  textTransform: 'uppercase',
}));

export const PixelText = styled(Typography)(({ theme }) => ({
  fontFamily: 'Video, monospace',
  fontSize: '9px',
  textAlign: 'center',
  whiteSpace: 'nowrap',
}));

export const SevenSegmentDisplay = styled(Typography)(({ theme }) => ({
  fontFamily: 'Seven Segment, monospace',
  color: 'limegreen',
  backgroundColor: 'black',
  padding: theme.spacing(0.5),
  letterSpacing: '2px',
}));

// Styled Button Components
export const RetroButton = styled(Button)(({ theme }) => ({
  fontFamily: 'Bitwise, monospace',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  boxShadow: '2px 2px magenta, 4px 4px black',
  border: '2px solid #55533c',
  padding: theme.spacing(0.5, 1),
  '&:hover': {
    boxShadow: '3px 3px magenta, 6px 6px black',
    transform: 'translate(-1px, -1px)',
  },
  '&:active': {
    transform: 'translate(1px, 1px)',
    boxShadow: '1px 1px magenta, 2px 2px black',
  },
}));

export const DangerButton = styled(RetroButton)(({ theme }) => ({
  backgroundColor: 'salmon',
  color: 'darkred',
  '&:hover': {
    backgroundColor: '#ff9999',
  },
}));

// Styled Input Components
export const RetroTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    fontFamily: 'Bit, monospace',
    backgroundColor: 'lightGrey',
    '& fieldset': {
      borderColor: '#55533c',
      borderWidth: '3px',
    },
    '&:hover fieldset': {
      borderColor: 'orange',
      borderWidth: '3px',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'limegreen',
      borderWidth: '3px',
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Bitwise, monospace',
    fontWeight: 'bold',
    '&.Mui-focused': {
      color: 'limegreen',
    },
  },
}));

// Styled Layout Components
export const DroppableContainer = styled(Box)(({ theme }) => ({
  border: "6px solid #55533c",
  borderLeft: "20px solid #55533c",
  borderRight: "20px solid #55533c",
  height: "80px",
  backgroundColor: "lightGrey",
  boxShadow: "2px 2px magenta, 6px 6px black",
  overflow: "hidden",
  padding: theme.spacing(0.5),
}));

export const SectionContainer = styled(Box)(({ theme }) => ({
  border: "3px dashed limegreen",
  padding: theme.spacing(1),
  margin: theme.spacing(0.5, 0),
}));

export const HeaderBar = styled(Box)(({ theme }) => ({
  backgroundColor: 'orange',
  padding: theme.spacing(1),
  borderBottom: '3px solid #55533c',
}));