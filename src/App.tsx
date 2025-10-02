import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import Top from "./components/Top";
import Updates from "./components/Updates";
import GlobalContextProvider from "./contexts/GlobalContext";
import { ScaleProvider, useDisplayScale } from "./contexts/ScaleContext";
import { mtmTheme } from "./theme";

const AppContent = () => {
  const { scaledTheme } = useDisplayScale();
  
  return (
    // @ts-ignore
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <ThemeProvider theme={scaledTheme}>
        <CssBaseline />
        <Updates />
        <GlobalContextProvider>
          <Top />
        </GlobalContextProvider>
      </ThemeProvider>
    </Box>
  );
};

function App() {
  return (
    <ScaleProvider>
      <AppContent />
    </ScaleProvider>
  );
}

export default App;
