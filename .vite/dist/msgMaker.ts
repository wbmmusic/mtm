// Two Bits
const commandIds = {
  time: 0,
  servo: 1,
  relay: 2
} as const;

// One Bit
const waitTypes = {
  remote: 0
} as const;

const makeServoPositionData = (servoNumber: number, position: number): number[] => {
  let commandByte = (commandIds.servo << 6); // Set ID
  commandByte = commandByte | (0 << 4); // Set Speed
  commandByte = commandByte | servoNumber; // Set ServoNumber
  return [commandByte, position];
};

const makeDelayData = (time: number): number[] => {
  let commandByte = 0;
  let timeLowByte = time & 0xFF;
  let timeHighByte = (time >> 8) & 0x1F;
  commandByte = commandByte | timeHighByte;
  return [commandByte, timeLowByte];
};

const makeWaitData = (type: number, val: number): number[] => {
  let commandByte = (commandIds.time << 6) | (1 << 5) | (type << 4) | (val & 0x0F);
  return [commandByte];
};

export { makeServoPositionData, makeDelayData, makeWaitData, waitTypes };