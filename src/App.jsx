import { Box, CssBaseline } from "@mui/material";
import Top from "./components/Top";
import Updates from "./components/Updates";
import GlobalContextProvider from "./contexts/GlobalContext";

function App() {
  return (
    <Box
      sx={{
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <CssBaseline />
      <Updates />
      <GlobalContextProvider>
        <Top />
      </GlobalContextProvider>
    </Box>
  );
}

export default App;
