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
    fontFamily: ["Bit"],
  },
});

function App() {
  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
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
