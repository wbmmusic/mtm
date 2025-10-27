/**
 * MTM APPLICATION THEME SYSTEM
 * 
 * This file defines the comprehensive visual design system for the MTM robot control application.
 * The theme implements a retro gaming aesthetic with pixel fonts, bright colors, and classic
 * visual elements reminiscent of 1980s-90s computer interfaces.
 * 
 * DESIGN PHILOSOPHY:
 * - Retro gaming aesthetic with pixelated fonts and bright colors
 * - High contrast elements for accessibility and visual clarity  
 * - Consistent spacing and proportions across all components
 * - Dynamic scaling support for different monitor DPI settings
 * - Custom Material-UI component overrides for cohesive styling
 * 
 * ARCHITECTURE:
 * - Color palette: Organized into semantic color groups (primary, secondary, accent)
 * - Typography: Pixel-perfect fonts loaded from local font files
 * - Component overrides: Custom styling for MUI components
 * - Utility styles: Common patterns for drag-and-drop, containers, etc.
 * - Scaling system: Dynamic font and size adjustments via ScaleContext
 * 
 * USAGE:
 * - Wrap app in ThemeProvider with mtmTheme
 * - Use styled components from ../components/styled for custom elements
 * - Access theme values via useTheme() hook in components
 * - Apply scaling through ScaleContext for DPI-aware UI
 */

import { createTheme } from '@mui/material/styles';

/**
 * RETRO COLOR PALETTE
 * 
 * Defines the core colors used throughout the application.
 * Colors are chosen to evoke classic computer and gaming interfaces
 * while maintaining good accessibility and visual hierarchy.
 */
const retroColors = {
  /**
   * PRIMARY COLOR SYSTEM
   * 
   * Signature yellow theme - the primary brand color for the MTM application.
   * Used for backgrounds, primary buttons, and main interface elements.
   */
  primary: {
    main: '#ffe400',    // Bright yellow - main brand color
    dark: '#ccb300',    // Darker yellow for hover states and depth
    light: '#fff666',   // Lighter yellow for highlights and active states
  },

  /**
   * SECONDARY COLOR SYSTEM
   * 
   * Neutral brown/grey tones for borders, dividers, and secondary elements.
   * Provides visual hierarchy without competing with primary colors.
   */
  secondary: {
    main: '#55533c',    // Dark brown - borders and frames
    dark: '#3d3b2a',    // Darker brown for shadows and depth
    light: '#6f6d58',   // Lighter brown for subtle backgrounds
  },

  /**
   * ACCENT COLOR PALETTE
   * 
   * Vibrant colors for specific UI elements, status indicators, and visual interest.
   * Chosen to complement the primary yellow while providing clear differentiation.
   */
  accent: {
    orange: '#ffa500',      // Orange - warning states and energy indicators
    lime: '#32cd32',        // Lime green - success states and positive feedback
    magenta: '#ff00ff',     // Magenta - highlights and special elements
    lightGrey: '#d3d3d3',   // Light grey - neutral backgrounds and dividers
    salmon: '#fa8072',      // Salmon - secondary highlights and accents  
    turquoise: '#afeeee',   // Turquoise - info states and calm elements
  },

  /**
   * SEMANTIC COLORS
   * 
   * Standard UI colors for common interface patterns and user feedback.
   */
  success: {
    main: '#32cd32',        // Green - success messages and positive states
  },
  error: {
    main: '#ff4444',        // Red - error messages and dangerous actions
  }
};

/**
 * MAIN THEME OBJECT
 * 
 * Creates the complete Material-UI theme with all customizations applied.
 * This theme is consumed by the ThemeProvider and ScaleContext system
 * to provide consistent styling throughout the application.
 */
export const mtmTheme = createTheme({
  /**
   * COLOR PALETTE CONFIGURATION
   * 
   * Maps the retro color definitions to Material-UI's palette system.
   * These colors are automatically applied to all MUI components and
   * can be accessed via theme.palette in styled components.
   */
  palette: {
    background: {
      default: retroColors.primary.main,  // App-wide background (yellow)
      paper: 'lightGrey',                 // Card and paper backgrounds
    },
    primary: retroColors.primary,         // Primary button and accent colors
    secondary: retroColors.secondary,     // Secondary elements and borders
    success: retroColors.success,         // Success messages and indicators
    error: retroColors.error,             // Error messages and warnings
  },

  /**
   * TYPOGRAPHY SYSTEM
   * 
   * Defines the pixel-perfect font stack for the retro aesthetic.
   * Fonts are loaded from src/fonts/ and provide authentic retro styling.
   * 
   * FONT HIERARCHY:
   * - Arcade: Large headers and titles (retro arcade style)
   * - Bit: General text and interface elements (clean pixel font)
   * - Video: Small text and details (compact pixel font)
   * - Seven Segment: Digital displays (optional for special elements)
   */
  typography: {
    fontFamily: 'Bit, monospace',           // Default font for all text
    h6: {
      fontFamily: 'Arcade, monospace',      // Large headers
      fontWeight: 'bold',                   // Bold weight for emphasis
    },
    body2: {
      fontSize: '9px',                      // Small text size
      fontFamily: 'Video, monospace',       // Compact font for details
    },
  },

  /**
   * SHAPE CONFIGURATION
   * 
   * Controls the overall geometric styling of components.
   * Sharp corners maintain the retro aesthetic and avoid modern rounded designs.
   */
  shape: {
    borderRadius: 0, // Sharp corners for authentic retro feel
  },
  components: {
    // Override MUI components to match your retro style
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Bitwise, monospace',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          boxShadow: '2px 2px #ff00ff, 4px 4px #000000', // magenta, black
          border: '2px solid #55533c',
          '&:hover': {
            boxShadow: '3px 3px #ff00ff, 6px 6px #000000',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontFamily: 'Bit, monospace',
            backgroundColor: '#d3d3d3', // lightGrey
            '& fieldset': {
              borderColor: '#55533c',
              borderWidth: '3px',
            },
            '&:hover fieldset': {
              borderColor: '#ffa500', // orange
            },
            '&.Mui-focused fieldset': {
              borderColor: '#32cd32', // limegreen
              borderWidth: '3px',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '2px 2px #ff00ff, 4px 4px #000000', // magenta, black
          border: '2px solid #55533c',
        },
      },
    },
    // Global scrollbar styling
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          // Webkit scrollbar styling (Chrome, Safari, Edge)
          '&::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#d3d3d3', // lightGrey
            border: '2px solid #55533c',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#ffa500', // orange
            border: '2px solid #55533c',
            '&:hover': {
              backgroundColor: '#32cd32', // limegreen on hover
            },
            '&:active': {
              backgroundColor: '#ff00ff', // magenta when clicked
            },
          },
          '&::-webkit-scrollbar-corner': {
            backgroundColor: '#d3d3d3', // lightGrey
            border: '2px solid #55533c',
          },
        },
        // Firefox scrollbar styling
        html: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#ffa500 #d3d3d3', // thumb track
        },
      },
    },
  },
});

// Export styled system constants
export const mtmStyles = {
  droppable: {
    border: "6px solid #55533c",
    borderLeft: "20px solid #55533c",
    borderRight: "20px solid #55533c",
    height: "80px",
    backgroundColor: "#d3d3d3", // lightGrey
    boxShadow: "2px 2px #ff00ff, 6px 6px #000000", // magenta, black
    overflow: "hidden" as const,
  },
  modal: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 2,
    userSelect: "none" as const,
  },
  sectionBorder: {
    border: "3px dashed #32cd32", // limegreen
    p: 1,
  },
  headerBar: {
    bgcolor: retroColors.accent.orange,
    p: 1,
    spacing: 1,
  },
} as const;