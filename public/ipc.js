const { ipcMain, dialog } = require('electron')
const { existsSync, readFileSync, rmdirSync, writeFileSync, mkdirSync } = require('node:fs')
const { join } = require('node:path')
const { upload, uploadFirmware } = require('./usb')
const { getRobots, pathToRobots, generateSequenceBuffer, prepareActions, saveSettings } = require('./utils')

ipcMain.on('uploadFirmware', () => uploadFirmware())

ipcMain.on('upload', async(e, actions) => {
    console.log("UPLOADDDD")
    if (port) {
        const sequenceBuffer = generateSequenceBuffer(prepareActions(actions))

        try {
            console.log("YEAH")
            win.webContents.send('upload_progress', { show: true, value: null })
            await upload(sequenceBuffer)
            win.webContents.send('upload_progress', { show: false, value: null })
        } catch (error) {
            throw error
        }
    } else {
        console.log('NO PORT!!!!')
    }
})

ipcMain.on('play', (e, file) => {
    if (settings.sound) win.webContents.send('play_file', file)
})

ipcMain.on('get_usb_status', () => {
    if (port) win.webContents.send('usb_status', true)
    else win.webContents.send('usb_status', false)
})

ipcMain.handle('sound', (e, onOff) => {
    settings.sound = onOff
    saveSettings()
    return settings.sound
})

ipcMain.handle('sendValue', async(e, data) => {
    console.log('Send Value')
    if (port) {
        // console.log("Send Serial", data)
        port.write(new Buffer.from(data), (err) => { if (err) console.log(err) })
    } else console.log("NO PORT")
    return true
})

ipcMain.handle('getRobots', async() => {
    return new Promise((resolve, reject) => {
        let rbts = getRobots()
        resolve(rbts)
    })
})

ipcMain.handle('getRobot', async(e, path) => {
    return new Promise((resolve, reject) => {
        try {
            const pathToRobot = join(pathToRobots, path, 'robot.json')
            if (!existsSync(pathToRobot)) throw new Error('Path to robot' + path + " does not exist")
            let bot = JSON.parse(readFileSync(pathToRobot))
            resolve(bot)
        } catch (error) {
            console.log(error.message)
            reject(error)
        }
    })
})

ipcMain.handle('deleteRobot', async(e, path) => {
    return new Promise((resolve, reject) => {
        try {
            console.log("Delete Robot", path)
            const robotPath = join(pathToRobots, path)
            if (existsSync(robotPath)) rmdirSync(robotPath, { recursive: true })
            else throw new Error('Folder with path ' + path + " does not exist")
            let rbts = getRobots()
            resolve(rbts)
        } catch (error) {
            reject(error)
        }

    })
})

ipcMain.handle('saveRobot', async(e, robot) => {
    return new Promise((resolve, reject) => {
        console.log("Save Robot", robot.name)
        const robotPath = join(pathToRobots, robot.path)
        const robotFilePath = join(robotPath, 'robot.json')

        if (existsSync(robotPath)) {
            reject(new Error("Robot folder path already exists"))
        } else {
            try {
                mkdirSync(robotPath)
                writeFileSync(robotFilePath, JSON.stringify(robot, null, ' '))
                resolve()
            } catch (error) {
                reject(error)
            }
        }
    })
})

ipcMain.handle('updateRobot', async(e, robot, oldPath) => {
    return new Promise((resolve, reject) => {
        const robotPath = join(pathToRobots, robot.path)
        const robotFilePath = join(robotPath, 'robot.json')

        if (oldPath) {
            const oldRobotFolderPath = join(pathToRobots, oldPath)
            if (existsSync(oldRobotFolderPath)) {
                try {
                    rmdirSync(oldRobotFolderPath, { recursive: true })
                    mkdirSync(robotPath)
                    writeFileSync(robotFilePath, JSON.stringify(robot))
                    const updatedRobot = readFileSync(robotFilePath)
                    resolve(updatedRobot)
                } catch (error) {
                    reject(error)
                }
            } else reject(new Error('Cant find oldPath ' + oldPath))

        } else {
            if (existsSync(robotFilePath)) {
                try {
                    writeFileSync(robotFilePath, JSON.stringify(robot, null, ' '))
                    const updatedRobot = JSON.parse(readFileSync(robotFilePath))
                    resolve(updatedRobot)
                } catch (error) {
                    reject(error)
                }
            } else reject(new Error("Can't find robot at " + robot.path))
        }
    })
})

ipcMain.handle('deleteUserRobots', async() => {
    return new Promise(async(resolve, reject) => {
        try {
            const robots = getRobots()
            robots.forEach(robot => {
                rmdirSync(join(pathToRobots, robot.path), { recursive: true })
            })
            resolve('deleted all user robots')
        } catch (error) {
            reject(error)
        }
    })
})

ipcMain.handle('exportRobot', async(e, path) => {
    return new Promise(async(resolve, reject) => {
        try {
            const robotPath = join(pathToRobots, path)
            const robotFilePath = join(robotPath, 'robot.json')
            const res = await dialog.showSaveDialog(win, { title: 'Export Robot', filters: [{ name: 'Robot File', extensions: ['json'] }] })
            if (res.canceled) resolve('canceled')
            let outputPath = normalize(res.filePath)
            cpSync(robotFilePath, outputPath)
            resolve(outputPath)
        } catch (error) {
            reject(error)
        }
    })
})

ipcMain.handle('createPosition', async(e, path, position) => {
    return new Promise(async(resolve, reject) => {
        console.log("Create Position", position.name)
        const robotPath = join(pathToRobots, path)
        const robotFilePath = join(robotPath, 'robot.json')

        if (existsSync(robotFilePath)) {
            try {
                let tempFile = JSON.parse(readFileSync(robotFilePath))
                tempFile.positions.push(position)
                writeFileSync(robotFilePath, JSON.stringify(tempFile, null, ' '))
                let positions = JSON.parse(readFileSync(robotFilePath)).positions
                resolve(positions)
            } catch (error) {
                reject(error)
            }
        } else reject('Cand find robot file ' + path)

    })
})

ipcMain.handle('deletePosition', async(e, path, position) => {
    return new Promise(async(resolve, reject) => {
        console.log("Delete Position", position.name)
        const robotPath = join(pathToRobots, path)
        const robotFilePath = join(robotPath, 'robot.json')

        if (existsSync(robotFilePath)) {
            try {
                let tempFile = JSON.parse(readFileSync(robotFilePath))
                tempFile.positions = tempFile.positions.filter(pos => pos.name !== position.name)
                writeFileSync(robotFilePath, JSON.stringify(tempFile, null, ' '))
                let positions = JSON.parse(readFileSync(robotFilePath)).positions
                resolve(positions)
            } catch (error) {
                reject(error)
            }
        } else reject('Cand find robot file ' + path)

    })
})

ipcMain.handle('updatePosition', async(e, path, position) => {
    return new Promise(async(resolve, reject) => {
        console.log("Update Position", position.name)
        const robotPath = join(pathToRobots, path)
        const robotFilePath = join(robotPath, 'robot.json')

        if (existsSync(robotFilePath)) {
            try {
                let tempFile = JSON.parse(readFileSync(robotFilePath))
                const positionIdx = tempFile.positions.findIndex(pos => pos.appId === position.appId)
                if (positionIdx < 0) reject('Didnt find position with appID' + position.appId)
                tempFile.positions[positionIdx] = position
                writeFileSync(robotFilePath, JSON.stringify(tempFile, null, ' '))
                let positions = JSON.parse(readFileSync(robotFilePath)).positions
                resolve(positions)
            } catch (error) {
                reject(error)
            }
        } else reject('Cand find robot file ' + path)

    })
})

ipcMain.handle("getPositions", async(e, path) => {
    return new Promise((resolve, reject) => {
        // console.log("Get Positions", path)
        const robotPath = join(pathToRobots, path)
        const robotFilePath = join(robotPath, 'robot.json')
        try {
            let positions = JSON.parse(readFileSync(robotFilePath)).positions
            resolve(positions)
        } catch (error) {
            reject(error)
        }
    })
})

ipcMain.handle('saveSequence', async(e, path, sequence) => {
    return new Promise(async(resolve, reject) => {
        try {
            console.log("New Sequence", sequence.name)
            const robotPath = join(pathToRobots, path)
            const robotFilePath = join(robotPath, 'robot.json')
            let tempRobot = JSON.parse(readFileSync(robotFilePath))
            tempRobot.sequences.push(sequence)
            writeFileSync(robotFilePath, JSON.stringify(tempRobot, null, ' '))
            resolve("Saved New Sequence " + sequence.name)
        } catch (error) {
            reject(error)
        }
    })
})

ipcMain.handle('deleteSequence', async(e, path, sequence) => {
    return new Promise(async(resolve, reject) => {
        try {
            console.log("Delete Sequence", sequence.appId)
            const robotPath = join(pathToRobots, path)
            const robotFilePath = join(robotPath, 'robot.json')
            let tempRobot = JSON.parse(readFileSync(robotFilePath))
            let seqId = tempRobot.sequences.findIndex(s => s.appId === sequence.appId)
            if (seqId < 0) throw new Error('Didnt Find Sequence')
            tempRobot.sequences.splice(seqId, 1)
            writeFileSync(robotFilePath, JSON.stringify(tempRobot, null, ' '))
            let sequences = JSON.parse(readFileSync(robotFilePath)).sequences
            resolve(sequences)
        } catch (error) {
            reject(error)
        }

    })
})

ipcMain.handle('updateSequence', async(e, path, sequence) => {
    return new Promise(async(resolve, reject) => {
        try {
            console.log("Update Sequence", sequence.appId)
            const robotPath = join(pathToRobots, path)
            const robotFilePath = join(robotPath, 'robot.json')
            let tempRobot = JSON.parse(readFileSync(robotFilePath))
            let seqIdx = tempRobot.sequences.findIndex(s => s.appId === sequence.appId)
            if (seqIdx < 0) throw new Error('Didnt Find Sequence')
            tempRobot.sequences.splice(seqIdx, 1, sequence)
            writeFileSync(robotFilePath, JSON.stringify(tempRobot, null, ' '))
            const sequences = JSON.parse(readFileSync(robotFilePath)).sequences
            resolve(sequences)
        } catch (error) {
            reject(error)
        }

    })
})

ipcMain.handle('getSequence', async(e, path, sequenceID) => {
    return new Promise(async(resolve, reject) => {
        try {
            // console.log("Get Sequence", path, sequenceID)
            const robotPath = join(pathToRobots, path)
            const robotFilePath = join(robotPath, 'robot.json')
            let tempSequences = JSON.parse(readFileSync(robotFilePath)).sequences
            let seqIdx = tempSequences.findIndex(s => s.appId === sequenceID)
            if (seqIdx < 0) throw new Error('Didnt Find Sequence')
            resolve(tempSequences[seqIdx])
        } catch (error) {
            reject(error)
        }

    })
})

ipcMain.handle('getServos', async(e, path) => {
    return new Promise(async(resolve, reject) => {
        try {
            console.log("Get Servos Sequence", path)
            const robotPath = join(pathToRobots, path)
            const robotFilePath = join(robotPath, 'robot.json')
            const bot = JSON.parse(readFileSync(robotFilePath))
            resolve(bot.servos)
        } catch (error) {
            reject(error)
        }
    })
})

ipcMain.handle('getSound', () => settings.sound)