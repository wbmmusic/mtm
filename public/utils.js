const { app } = require('electron')
const { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync } = require('node:fs');
const { join, } = require('node:path')
const { makeServoPositionData, makeDelayData, makeWaitData, waitTypes } = require('./msgMaker')

const pathToUserData = join(app.getPath('userData'), 'data')
const pathToUserSettings = join(pathToUserData, 'settings.json')
const pathToRobots = join(pathToUserData, 'robots')
const pathToFirmwareFolder = join(pathToUserData, 'firmware')

global.settings;


const readSettings = () => {
    return JSON.parse(readFileSync(pathToUserSettings))
}

const saveSettings = () => {
    writeFileSync(pathToUserSettings, JSON.stringify(settings, null, ' '))
    settings = readSettings()
}

const checkFolders = () => {
    const defaultSettings = {
        sound: true
    }
    if (!existsSync(pathToUserData)) mkdirSync(pathToUserData)
    if (!existsSync(pathToRobots)) mkdirSync(pathToRobots)
    if (!existsSync(pathToFirmwareFolder)) mkdirSync(pathToFirmwareFolder)
    if (!existsSync(pathToUserSettings)) {
        settings = defaultSettings
        saveSettings()
    }
}

const getRobots = () => {
    const folders = readdirSync(pathToRobots, { withFileTypes: true }).filter(dirent => dirent.isDirectory())
    let robots = []
    folders.forEach(folder => {
        const pathToRobot = join(pathToRobots, folder.name)
        const pathToRobotFile = join(pathToRobot, 'robot.json')
        if (existsSync(pathToRobot) && existsSync(pathToRobotFile)) {
            robots.push(JSON.parse(readFileSync(pathToRobotFile)))
        }
    })
    return robots
}

// Merge serial positions and serial delays & Strip unnecessary elements
const prepareActions = (actions) => {
    console.log("In prepare actions")
    let out = []

    actions.forEach((act, idx) => {
        // Strip elements we no longer need
        delete act.content
            // If it is a wait we don't need the value element (we use .key)
        if (act.type === 'wait') delete act.value

        const prevIdx = out.length - 1

        // If this is the first action we know it needs to go into the ouput
        if (idx === 0) out.push(act)
        else {
            // If this action has the same type as the previous action
            if (out[prevIdx].type === act.type) {
                if (act.type === 'delay') {
                    // We just add the value of this delay action to the current value
                    out[prevIdx].value = out[prevIdx].value + act.value
                } else if (act.type === 'move') {
                    // Check the action for any enabled servos
                    act.servos.forEach((srv, idx) => {
                        // if this servo is enabled in the action we want its data
                        if (srv.enabled) {
                            // Overwrite or set the servo value
                            out[prevIdx].servos[idx].value = srv.value
                                // Overwrite or set the servos enable | This may already be true
                            out[prevIdx].servos[idx].enabled = true
                        }
                    })
                } else if (act.type === 'wait') {
                    // replace entire wait action with this latest one
                    out[prevIdx] = act
                } else {
                    console.log("Duplicate UNKNOWN action types in prepareActions()")
                    out.push(act)
                }

                // Else this does not require combining of actions all we have done is strip elements
            } else out.push(act)
        }
    })
    return out
}

// Take prepared actions and turn them into a buffer to be copied to MCU flash
const generateSequenceBuffer = (actions) => {
    console.log("In Generate Sequence Buffer")
    let out = []

    let timePos = 0;
    actions.forEach(action => {
        if (action.type === 'delay') {
            // move timePos to after this delay
            timePos = timePos + action.value

            // write delay bytes to buffer
            out.push(...makeDelayData(timePos))

        } else if (action.type === 'move') {
            action.servos.forEach((servo, idx) => {
                // If this servo is not used we have no reason to put it in memory
                if (servo.enabled) {
                    // write servo bytes to buffer
                    out.push(...makeServoPositionData(idx, servo.value))
                }
            })
        } else if (action.type === 'wait') {
            // write wait bytes to buffer
            out.push(...makeWaitData(waitTypes.remote, 1))
        }
    })

    // Add 0xFFFFFFFF to mark the end of the sequence
    out.push(...[255, 255, 255, 255])
        // Return out as a buffer
    return new Buffer.from(out)
}

settings = readSettings()

module.exports = { checkFolders, getRobots, pathToRobots, pathToFirmwareFolder, prepareActions, generateSequenceBuffer, saveSettings }