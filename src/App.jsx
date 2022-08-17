import { Box, CssBaseline } from "@mui/material";
import Top from "./components/Top";
import Updates from "./components/Updates";

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
      <Top />
    </Box>
  );
}

export default App;
