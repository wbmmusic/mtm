import { createTheme } from '@mui/material/styles';

// Define your retro color palette
const retroColors = {
  primary: {
    main: '#ffe400', // Your signature yellow
    dark: '#ccb300',
    light: '#fff666',
  },
  secondary: {
    main: '#55533c', // Border color
    dark: '#3d3b2a',
    light: '#6f6d58',
  },
  accent: {
    orange: 'orange',
    lime: 'limegreen', 
    magenta: 'magenta',
    lightGrey: 'lightGrey',
    salmon: 'salmon',
    turquoise: 'paleTurquoise',
  },
  success: {
    main: 'limegreen',
  },
  error: {
    main: '#ff4444',
  }
};

// Create the theme with proper structure
export const mtmTheme = createTheme({
  palette: {
    background: {
      default: retroColors.primary.main,
      paper: 'lightGrey',
    },
    primary: retroColors.primary,
    secondary: retroColors.secondary,
    success: retroColors.success,
    error: retroColors.error,
  },
  typography: {
    fontFamily: 'Bit, monospace',
    h6: {
      fontFamily: 'Arcade, monospace',
      fontWeight: 'bold',
    },
    body2: {
      fontSize: '9px',
      fontFamily: 'Video, monospace',
    },
  },
  shape: {
    borderRadius: 0, // Keep your sharp aesthetic
  },
  components: {
    // Override MUI components to match your retro style
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Bitwise, monospace',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          boxShadow: '2px 2px magenta, 4px 4px black',
          border: '2px solid #55533c',
          '&:hover': {
            boxShadow: '3px 3px magenta, 6px 6px black',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontFamily: 'Bit, monospace',
            backgroundColor: 'lightGrey',
            '& fieldset': {
              borderColor: '#55533c',
              borderWidth: '3px',
            },
            '&:hover fieldset': {
              borderColor: 'orange',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'limegreen',
              borderWidth: '3px',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '2px 2px magenta, 4px 4px black',
          border: '2px solid #55533c',
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
    backgroundColor: "lightGrey",
    boxShadow: "2px 2px magenta, 6px 6px black",
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
    border: "3px dashed limegreen",
    p: 1,
  },
  headerBar: {
    bgcolor: retroColors.accent.orange,
    p: 1,
    spacing: 1,
  },
} as const;