const commandIds = {
    time: 0,
    servo: 1,
    relay: 2
}


const makeServoPositionData = (servoNumber, position) => {
    let commandByte = (commandIds.servo << 6) // Set ID
    commandByte = commandByte | (0 << 4) // Set Speen
    commandByte = commandByte | servoNumber // Set ServoNumber

    console.log(commandByte, position)
    return [commandByte, position]
}

const makeDelayData = (time) => {
    let commandByte = 0
    let timeLowByte = time & 0xFF
    let timeHighByte = (time >> 8) & 0x1F
    commandByte = commandByte | timeHighByte
    return [commandByte, timeLowByte]
}

module.exports = { makeServoPositionData, makeDelayData }