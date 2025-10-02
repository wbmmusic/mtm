/**
 * DYNAMIC DPI SCALING SYSTEM
 * 
 * This context provides automatic UI scaling based on monitor DPI settings to ensure
 * consistent visual appearance across different display configurations. The system
 * detects display changes and adjusts theme values accordingly.
 * 
 * CORE FUNCTIONALITY:
 * - Automatic detection of monitor DPI scaling changes
 * - Dynamic theme adjustment with inverse scaling calculations
 * - Real-time theme updates when displays are added/removed/changed
 * - Maintains visual consistency across different monitor setups
 * 
 * TECHNICAL APPROACH:
 * - Listens to main process display events via IPC
 * - Calculates inverse scale factors to counteract system scaling
 * - Creates new theme instances with adjusted font sizes and spacing
 * - Provides scaled theme through React context for component consumption
 * 
 * USAGE:
 * - Wrap application root with ScaleProvider
 * - Access scaledTheme through useScale() hook in components
 * - Theme automatically updates when display configuration changes
 * - Works with both Material-UI components and custom styled components
 * 
 * SCALING STRATEGY:
 * - System DPI scale factor 1.25x → Theme adjustment 0.8x (inverse)
 * - System DPI scale factor 1.5x → Theme adjustment 0.67x (inverse)  
 * - This maintains consistent pixel-perfect appearance across all displays
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createTheme, Theme } from '@mui/material/styles';
import { mtmTheme } from '../theme'; // Base theme without scaling

/**
 * SCALE CONTEXT TYPE DEFINITION
 * 
 * Defines the shape of data provided by the ScaleContext to consuming components.
 */
interface ScaleContextType {
  scaleFactor: number;    // Current display scale factor (from system DPI)
  scaledTheme: Theme;     // Material-UI theme adjusted for current scale
}

/**
 * SCALE CONTEXT CREATION
 * 
 * Creates React context with default values for scale factor and theme.
 * Components can consume this context to access DPI-aware styling.
 */
const ScaleContext = createContext<ScaleContextType>({
  scaleFactor: 1,         // Default 1:1 scaling (100% DPI)
  scaledTheme: mtmTheme,  // Base theme as fallback
});

// Function to create scaled theme
const createScaledTheme = (baseTheme: Theme, scaleFactor: number): Theme => {
  // Inverse scaling to maintain consistent visual size
  const adjustmentFactor = 1 / scaleFactor;
  
  return createTheme({
    ...baseTheme,
    typography: {
      ...baseTheme.typography,
      h6: {
        ...baseTheme.typography.h6,
        fontSize: `${16 * adjustmentFactor}px`,
      },
      body1: {
        ...baseTheme.typography.body1,
        fontSize: `${14 * adjustmentFactor}px`,
      },
      body2: {
        ...baseTheme.typography.body2,
        fontSize: `${9 * adjustmentFactor}px`,
      },
      button: {
        ...baseTheme.typography.button,
        fontSize: `${12 * adjustmentFactor}px`,
      },
    },
    components: {
      ...baseTheme.components,
      MuiButton: {
        ...baseTheme.components?.MuiButton,
        styleOverrides: {
          ...baseTheme.components?.MuiButton?.styleOverrides,
          root: {
            ...(baseTheme.components?.MuiButton?.styleOverrides?.root as Record<string, any> || {}),
            fontSize: `${12 * adjustmentFactor}px`,
            padding: `${6 * adjustmentFactor}px ${16 * adjustmentFactor}px`,
          },
        },
      },
      MuiTextField: {
        ...baseTheme.components?.MuiTextField,
        styleOverrides: {
          ...baseTheme.components?.MuiTextField?.styleOverrides,
          root: {
            ...(baseTheme.components?.MuiTextField?.styleOverrides?.root as Record<string, any> || {}),
            '& .MuiInputBase-input': {
              fontSize: `${14 * adjustmentFactor}px`,
            },
            '& .MuiInputLabel-root': {
              fontSize: `${12 * adjustmentFactor}px`,
            },
          },
        },
      },
    },
  });
};

export const useDisplayScale = (): ScaleContextType => {
  const context = useContext(ScaleContext);
  if (!context) {
    throw new Error('useDisplayScale must be used within a ScaleProvider');
  }
  return context;
};

interface ScaleProviderProps {
  children: ReactNode;
}

export const ScaleProvider: React.FC<ScaleProviderProps> = ({ children }) => {
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  const [scaledTheme, setScaledTheme] = useState<Theme>(mtmTheme);

  useEffect(() => {
    const handleDisplayChange = (data: { scaleFactor: number }) => {
      console.log('Display scale factor changed:', data.scaleFactor);
      setScaleFactor(data.scaleFactor);
      setScaledTheme(createScaledTheme(mtmTheme, data.scaleFactor));
    };

    // Listen for display changes from main process
    if (window.electron?.receive) {
      window.electron.receive('display-changed', handleDisplayChange);
    }

    return () => {
      if (window.electron?.removeListener) {
        window.electron.removeListener('display-changed');
      }
    };
  }, []);

  const value: ScaleContextType = {
    scaleFactor,
    scaledTheme,
  };

  return (
    <ScaleContext.Provider value={value}>
      {children}
    </ScaleContext.Provider>
  );
};

export default ScaleContext;