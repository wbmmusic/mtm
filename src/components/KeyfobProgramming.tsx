import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Warning,
  Settings,
} from '@mui/icons-material';
import { GlobalContext } from '../contexts/GlobalContext';
import { safeInvoke } from '../helpers';

const KeyfobProgramming: React.FC = () => {
  const { usbConnected } = useContext(GlobalContext);
  const [open, setOpen] = useState(false);
  const [programming, setProgramming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttons = [
    { id: 1, name: 'Start', icon: <PlayArrow />, color: 'success' as const },
    { id: 2, name: 'Continue', icon: <PlayArrow />, color: 'primary' as const },
    { id: 3, name: 'Stop', icon: <Stop />, color: 'error' as const },
    { id: 4, name: 'Emergency', icon: <Warning />, color: 'warning' as const },
  ];

  const programButton = async (buttonId: number) => {
    try {
      setError(null);
      setProgramming(true);
      await safeInvoke('programKeyfobButton', buttonId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to program button');
    } finally {
      setProgramming(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Settings />}
        onClick={() => setOpen(true)}
        disabled={!usbConnected}
        size="small"
      >
        Keyfob
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Typography variant="h6" sx={{ fontSize: '1.3rem' }}>Program Keyfob</Typography></DialogTitle>
        <DialogContent>
          {!usbConnected && (
            <Alert severity="warning" sx={{ mb: 2, fontSize: '1.1rem' }}>
              Connect MTM device via USB
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '1.1rem' }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {buttons.map((button) => (
              <Grid item xs={6} key={button.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {button.icon}
                      <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{button.name}</Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color={button.color}
                      onClick={() => programButton(button.id)}
                      disabled={programming}
                      startIcon={programming ? <CircularProgress size={16} /> : undefined}
                      fullWidth
                    >
                      Program
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default KeyfobProgramming;