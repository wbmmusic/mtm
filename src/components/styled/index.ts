/**
 * STYLED COMPONENTS LIBRARY
 * 
 * This module provides a comprehensive collection of pre-styled Material-UI components
 * that implement the MTM application's retro gaming aesthetic. All components are
 * designed to work seamlessly with the theme system and DPI scaling context.
 * 
 * DESIGN PRINCIPLES:
 * - Consistent retro gaming visual language across all components
 * - Pixel-perfect fonts and sharp geometric styling
 * - Bold colors with high contrast for accessibility
 * - Interactive feedback through shadows, transforms, and animations
 * - Theme-aware styling that adapts to color palette changes
 * 
 * COMPONENT CATEGORIES:
 * - Typography: Text elements with pixel fonts and retro styling
 * - Buttons: Interactive elements with 3D shadow effects
 * - Inputs: Form controls with custom borders and backgrounds
 * - Containers: Layout elements with consistent spacing and borders
 * - Progress: Loading indicators with retro styling
 * - Modals: Dialog components with themed backgrounds and controls
 * 
 * USAGE:
 * - Import specific components as needed: { RetroButton, PixelText }
 * - Components automatically inherit theme colors and scaling
 * - All components support standard MUI props and customization
 * - Use sx prop for additional styling when needed
 */

import { styled } from '@mui/material/styles';
import { Typography, Button, TextField, Box, LinearProgress } from '@mui/material';

/**
 * TYPOGRAPHY COMPONENTS
 * 
 * Text elements using pixel fonts with retro styling effects.
 * Each component targets specific use cases in the interface hierarchy.
 */

/**
 * RETRO TITLE COMPONENT
 * 
 * Large header text with arcade-style font and magenta text shadow.
 * Used for section headers, modal titles, and primary interface labels.
 */
export const RetroTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'Arcade, monospace',        // Retro arcade font
  fontWeight: 'bold',                     // Bold weight for emphasis
  fontSize: '18px',                       // Large size for hierarchy
  color: theme.palette.text.primary,     // Theme-aware text color
  textShadow: '1px 1px 0px #ff00ff',     // Magenta shadow for retro effect
  textTransform: 'uppercase',             // Uppercase for classic computer style
}));

/**
 * PIXEL TEXT COMPONENT
 * 
 * Standard body text with clean pixel font and subtle shadow.
 * Used for general interface text, labels, and descriptions.
 */
export const PixelText = styled(Typography)(({ theme }) => ({
  fontFamily: 'Bit, monospace',          // Clean pixel font
  fontSize: '12px',                      // Standard readable size
  color: '#000000',                      // High contrast black text
  textShadow: '1px 1px #ffffff',        // White shadow for depth
  userSelect: 'none',                    // Prevent text selection for UI elements
}));

// Export custom modal component
export { default as RetroConfirmModal } from './RetroConfirmModal';

export const SevenSegmentDisplay = styled(Typography)(({ theme }) => ({
  fontFamily: 'Seven Segment, monospace',
  color: '#32cd32', // limegreen
  backgroundColor: '#000000',
  padding: theme.spacing(0.5),
  letterSpacing: '2px',
}));

// Styled Button Components
export const RetroButton = styled(Button)(({ theme }) => ({
  fontFamily: 'Bitwise, monospace',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  boxShadow: '2px 2px #ff00ff, 4px 4px #000000', // magenta, black
  border: '2px solid #55533c',
  padding: theme.spacing(0.5, 1),
  '&:hover': {
    boxShadow: '3px 3px #ff00ff, 6px 6px #000000',
    transform: 'translate(-1px, -1px)',
  },
  '&:active': {
    transform: 'translate(1px, 1px)',
    boxShadow: '1px 1px #ff00ff, 2px 2px #000000',
  },
}));

export const DangerButton = styled(RetroButton)(({ theme }) => ({
  backgroundColor: '#fa8072', // salmon
  color: '#8b0000', // darkred
  '&:hover': {
    backgroundColor: '#ff9999',
  },
}));

// Styled Input Components
export const RetroTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    fontFamily: 'Bit, monospace',
    backgroundColor: '#d3d3d3', // lightGrey
    '& fieldset': {
      borderColor: '#55533c',
      borderWidth: '3px',
    },
    '&:hover fieldset': {
      borderColor: '#ffa500', // orange
      borderWidth: '3px',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#32cd32', // limegreen
      borderWidth: '3px',
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Bitwise, monospace',
    fontWeight: 'bold',
    '&.Mui-focused': {
      color: '#32cd32', // limegreen
    },
  },
}));

// Styled Layout Components
export const DroppableContainer = styled(Box)(({ theme }) => ({
  border: "6px solid #55533c",
  borderLeft: "20px solid #55533c",
  borderRight: "20px solid #55533c",
  height: "80px",
  backgroundColor: "#d3d3d3", // lightGrey
  boxShadow: "2px 2px #ff00ff, 6px 6px #000000", // magenta, black
  overflow: "hidden",
  padding: theme.spacing(0.5),
}));

export const SectionContainer = styled(Box)(({ theme }) => ({
  border: "3px dashed #32cd32", // limegreen
  padding: theme.spacing(1),
  margin: theme.spacing(0.5, 0),
}));

export const HeaderBar = styled(Box)(({ theme }) => ({
  backgroundColor: '#ffa500', // orange
  padding: theme.spacing(1),
  borderBottom: '3px solid #55533c',
}));

export const RetroProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: '8px',
  borderRadius: 0,
  border: '1px solid #55533c',
  '& .MuiLinearProgress-bar': {
    backgroundColor: '#32cd32', // limegreen for active
    transition: 'none', // Sharp, instant changes for retro feel
  },
  '& .MuiLinearProgress-root': {
    backgroundColor: '#666666', // dark grey for inactive
  },
}));

// Modal Components
export const RetroModalContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  backgroundColor: theme.palette.background.paper,
  border: '3px solid #55533c',
  boxShadow: '4px 4px #ff00ff, 8px 8px #000000', // magenta, black
  padding: theme.spacing(2),
  userSelect: 'none',
  fontFamily: 'Bit, monospace',
}));