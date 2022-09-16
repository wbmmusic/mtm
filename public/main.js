const { app, BrowserWindow, ipcMain, protocol, dialog } = require('electron')
const { join, normalize } = require('path')
const url = require('url')
const { autoUpdater } = require('electron-updater');
const { SerialPort } = require('serialport');
const { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync, rmdirSync, cpSync } = require('fs');
const { usb } = require('usb');

let firstReactInit = true

////////////////// App Startup ////////////////////////////////////////////////////////////////////
let win

let port = null
let settings;

const pathToUserData = join(app.getPath('userData'), 'data')
const pathToUserSettings = join(pathToUserData, 'settings.json')
const pathToRobots = join(pathToUserData, 'robots')

const usbTarget = [
    { vid: 0x2341, pid: 0x43 },
    { vid: 0x03EB, pid: 0x2404 }
]

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
    if (!existsSync(pathToUserSettings)) {
        settings = defaultSettings
        saveSettings()
    }
}

checkFolders();

settings = readSettings()

const getPorts = async() => {
    return new Promise(async(resolve, reject) => {
        try {
            let tempPorts = await SerialPort.list()
            resolve(tempPorts.filter(prt => !prt.path.includes('BLTH') && !prt.path.includes('Bluetooth')))
        } catch (error) {
            reject(error)
        }

    })

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

const openPort = async() => {
    return new Promise(async(resolve, reject) => {
        try {
            let tempPorts = await getPorts()
            let thePorts = tempPorts.filter(prt => {
                for (let i = 0; i < usbTarget.length; i++) {
                    if (Number("0x" + prt.vendorId) === usbTarget[i].vid && Number("0x" + prt.productId) === usbTarget[i].pid) return true
                }
            })

            if (thePorts.length > 0) {
                if (thePorts.length > 1) {
                    console.log("MORE THAN ONE DEVICE CONNECTED")
                }
                console.log('Found device', thePorts[0].friendlyName)
                port = new SerialPort({ path: thePorts[0].path, baudRate: 115200 })
                port.on('open', () => {
                    console.log('PORT OPENED')
                    win.webContents.send('usb_status', true)
                    resolve(true)
                })
                port.on('close', () => {
                    port = null
                    console.log("Port Closed")
                    win.webContents.send('usb_status', false)
                })

            } else reject("Didn't Find target Device")
        } catch (error) {
            reject(error)
        }
    })
}

const tryToOpenPort = async() => {
    try {
        await openPort()
    } catch (error) {
        console.log("Error on 1st atempt to connect", error)
        setTimeout(async() => {
            try {
                await openPort()
            } catch (error) {
                console.log("Error on 2nd atempt to connect", error)
            }
        }, 1000);
    }

}

////////  SINGLE INSTANCE //////////
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) app.quit()

app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) win.restore()
            win.focus()
        }
    })
    //////  END SINGLE INSTANCE ////////

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            sandbox: false
        },
        icon: join(__dirname, '/favicon.ico'),
        title: "MTM --- v" + app.getVersion()
    })

    const startUrl = process.env.ELECTRON_START_URL || url.format({
        pathname: join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
    });
    win.loadURL(startUrl);
    //win.maximize()

    // Emitted when the window is closed.
    win.on('closed', () => win = null)

    win.on('ready-to-show', () => win.show())

}

const initIpcHandlers = () => {
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
        //console.log("Send Serial", data)
        if (port) port.write(new Buffer.from(data))
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
            console.log("Get Positions", path)
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
                console.log("Get Sequence", path, sequenceID)
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
}

// Create myWindow, load the rest of the app, etc...
app.on('ready', () => {
        //log("-APP IS READY");

        protocol.registerFileProtocol('sound', (request, callback) => {
            const url = request.url.substr(7)
            console.log("SOUND URL ->", url)
            callback({ path: join(__dirname, 'sounds', url) })
        })

        protocol.registerFileProtocol('img', (request, callback) => {
            const url = request.url.substr(5)
            console.log("IMAGE URL ->", url)
            callback({ path: join(__dirname, 'images', url) })
        })

        ipcMain.on('reactIsReady', () => {
            win.webContents.send('app_version', app.getVersion());
            if (firstReactInit === true) {
                firstReactInit = false
                console.log('React Is Ready')
                if (app.isPackaged) {
                    win.webContents.send('message', 'App is packaged')

                    autoUpdater.on('error', (err) => win.webContents.send('updater', err))
                    autoUpdater.on('checking-for-update', () => win.webContents.send('updater', "checking-for-update"))
                    autoUpdater.on('update-available', (info) => win.webContents.send('updater', 'update-available', info))
                    autoUpdater.on('update-not-available', (info) => win.webContents.send('updater', 'update-not-available', info))
                    autoUpdater.on('download-progress', (info) => win.webContents.send('updater', 'download-progress', info))
                    autoUpdater.on('update-downloaded', (info) => win.webContents.send('updater', 'update-downloaded', info))
                    ipcMain.on('installUpdate', () => {
                        win.webContents.send('updater', 'relaunching')
                        autoUpdater.quitAndInstall()
                    })

                    setTimeout(() => autoUpdater.checkForUpdates(), 3000);
                    setInterval(() => autoUpdater.checkForUpdates(), 1000 * 60 * 60);
                }
            }
        })

        initIpcHandlers()

        usb.on('attach', async(e) => {
            // console.log("Attatch")
            const vid = e.deviceDescriptor.idVendor
            const pid = e.deviceDescriptor.idProduct

            for (let i = 0; i < usbTarget.length; i++) {
                if (vid === usbTarget[i].vid && pid === usbTarget[i].pid) {
                    // console.log("Arduino UNO was attached")
                    if (!port) {
                        tryToOpenPort()
                        break
                    } else console.log("Device Attached but another is already connected")
                }
            }

        })

        usb.on('detach', (e) => {
            // console.log("Detatch")
            const vid = e.deviceDescriptor.idVendor
            const pid = e.deviceDescriptor.idProduct
            for (let i = 0; i < usbTarget.length; i++) {
                if (vid === usbTarget[i].vid && pid === usbTarget[i].pid) {
                    console.log("Device was detached")
                    if (port) {
                        port.close()
                        break
                    }
                }
            }
        })

        tryToOpenPort()

        createWindow()
    })
    ///////////////////////

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit())

app.on('activate', () => {
    if (win === null) createWindow()
})

////////////////// END App Startup ///////////////////////////////////////////////////////////////