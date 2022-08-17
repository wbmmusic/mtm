import { Box, CssBaseline } from "@mui/material";
import Top from "./components/Top";

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
    </Box>
  );
}

export default App;
