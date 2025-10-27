import {
  Box,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Slider from "@mui/material/Slider";
import React, { useState, useMemo } from "react";
import { getMsgMkr, safeInvoke } from "../../helpers";
import type { Servo as ServoType } from "../../types";

export const Servo: React.FC<{
  label: string;
  idx: number;
  servo: ServoType;
  onChange: (t: string, v: number | boolean) => void;
}> = ({ label, idx, servo, onChange }) => {
  const [lastSent, setLastSent] = useState<number | null>(null);

  const makeServoPositionData = useMemo(() => {
    const mk = getMsgMkr();
    return typeof mk?.makeServoPositionData === "function"
      ? (mk.makeServoPositionData as (i: number, v: number) => number[])
      : () => [] as number[];
  }, []);

  const handleChange = (val: number | number[]) => {
    const value = Array.isArray(val) ? val[0] : val;
    if (value !== lastSent) {
      setLastSent(value as number);
      try {
        const packet = makeServoPositionData(idx - 1, value as number);
        safeInvoke("sendValue", packet).catch((err: unknown) =>
          console.log(err)
        );
      } catch (e) {
        console.log(e);
      }
    }

    onChange("value", value as number);
  };

  return (
    <Box component={Paper} p={2} elevation={4}>
      <Stack direction="row">
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(servo?.enabled)}
              onChange={e => onChange("enabled", e.target.checked)}
              size="small"
            />
          }
          label={label}
        />
        <Box width={"100%"} />
        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
          {"Servo " + idx}
        </Typography>
      </Stack>
      <Slider
        value={servo?.value ?? 90}
        disabled={!servo?.enabled}
        min={0}
        max={180}
        step={1}
        defaultValue={90}
        valueLabelDisplay="auto"
        onChange={(e, v) => handleChange(v as number)}
      />
    </Box>
  );
};
