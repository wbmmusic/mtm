import { Box, CssBaseline } from "@mui/material";
import Top from "./components/Top";
import Updates from "./components/Updates";

function App() {
  return (
    <Box
      sx={{
        borderTop: "1px solid lightgrey",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <CssBaseline />
      <Top />
      <Updates />
    </Box>
  );
}

export default App;
