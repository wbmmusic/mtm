// Two Bits
const commandIds = {
    time: 0,
    servo: 1,
    relay: 2
}

// One Bit
const waitTypes = {
    remote: 0
}


const makeServoPositionData = (servoNumber, position) => {
    let commandByte = (commandIds.servo << 6) // Set ID
    commandByte = commandByte | (0 << 4) // Set Speed
    commandByte = commandByte | servoNumber // Set ServoNumber
    return [commandByte, position]
}

const makeDelayData = (time) => {
    let commandByte = 0
    let timeLowByte = time & 0xFF
    let timeHighByte = (time >> 8) & 0x1F
    commandByte = commandByte | timeHighByte
    return [commandByte, timeLowByte]
}

const makeWaitData = (type, val) => {
    let commandByte = (commandIds.time << 6) | (1 << 5) | (type << 4) | (val & 0x0F);
    return [commandByte]
}

module.exports = { makeServoPositionData, makeDelayData, makeWaitData, waitTypes }