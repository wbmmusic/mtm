import { Box, createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import Top from "./components/Top";
import Updates from "./components/Updates";
import GlobalContextProvider from "./contexts/GlobalContext";

const theme = createTheme({
  palette: {
    background: {
      default: "#ffe400",
    },
  },
  typography: {
    fontFamily: "Bit",
  },
  shape: {
    borderRadius: 0,
  },
});

function App() {
  return (
    // @ts-ignore
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* @ts-ignore */}
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Updates />
        <GlobalContextProvider>
          <Top />
        </GlobalContextProvider>
      </ThemeProvider>
    </Box>
  );
}

export default App;
