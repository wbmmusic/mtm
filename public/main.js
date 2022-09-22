const { app, BrowserWindow, ipcMain, protocol, dialog } = require('electron')
const { join, normalize } = require('path')
const url = require('url')
const { autoUpdater } = require('electron-updater');
const { SerialPort } = require('serialport');
const { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync, rmdirSync, cpSync, readFile } = require('fs');
const { usb } = require('usb');
const { EventEmitter } = require('node:events');

class MyEmitter extends EventEmitter {}
const uploadEmitter = new MyEmitter();
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
                port.on('error', (err) => console.error(err))

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

const prepareActions = (actions) => {
    let out = []
    actions.forEach((act, idx) => {
        delete act.content
        if (idx === 0) out.push(act)
        else {
            if (out[out.length - 1].type === act.type) {
                if (act.type === 'delay') {
                    out[out.length - 1].value = out[out.length - 1].value + act.value
                } else if (act.type === 'move') {
                    act.servos.forEach((srv, idx) => {
                        if (srv.enabled) {
                            out[out.length - 1].servos[idx].value = srv.value
                            out[out.length - 1].servos[idx].enabled = true
                        }
                    })
                } else {
                    console.log("ERROR HERE 872341")
                    out.push(act)
                }

            } else out.push(act)
        }
    })
    return out
}

const makeTime = (time) => new Buffer.from([(time >> 8) & 0x1F, time & 0xFF])
const makeServo = (servo, idx) => new Buffer.from([(idx + 1) | 0x40, servo.value])

const generateSequenceArray = (actions) => {
    let out = []
    let curTimePos = 0;
    actions.forEach(action => {
        if (action.type === 'delay') {
            curTimePos = curTimePos + action.value
            out.push(makeTime(curTimePos))
        } else if (action.type === 'move') {
            action.servos.forEach((servo, idx) => {
                // console.log(servo)
                if (servo.enabled) {
                    out.push(makeServo(servo, idx))
                }
            })
        }
    })

    out.push(new Buffer.from([255, 255, 255, 255]))

    return Buffer.concat(out)
}

const sendProgramCommand = async() => {
    return new Promise(async(resolve, reject) => {
        const exit = (data, err) => {
            clearTimeout(timer)
            port.removeListener('data', handleData)
            if (err) reject(err)
            else resolve(data)
        }
        const handleData = (data) => {
            if (data.toString().includes('WBM:READY')) {
                console.log('Device is ready for sequence')
                exit({})
            } else exit({}, new Error('Didnt get expected response in sendProgramCommand'))
        }
        const timer = setTimeout(() => exit({}, new Error('sendProgramCommand timed out')), 1000);
        port.on('data', handleData)
        port.write('WBM:LOAD')
    })
}

const sendPage = async(page) => {
    return new Promise(async(resolve, reject) => {
        const exit = (data, err) => {
            clearInterval(timer)
            port.removeListener('data', handleData)
            if (err) throw err
            else resolve(data)
        }
        const handleData = (data) => {
                if (JSON.stringify([...data]) === JSON.stringify([...page])) {
                    exit({})
                } else {
                    exit({}, new Error('Page Mismatch in sendPage'))
                }
            }
            // console.log("Send Page")
        const timer = setTimeout(() => exit({}, new Error('sendPage timed out')), 1000);
        // console.log('Sending Page', page.length)
        port.on('data', handleData)
        port.write(new Buffer.from(page))
    })

}

const sendDone = async() => {
    return new Promise(async(resolve, reject) => {
        const exit = (data, err) => {
            clearInterval(timer)
            port.removeListener('data', handleData)
            if (err) reject(err)
            else resolve(data)
        }
        const handleData = (data) => {
            if (data.toString().includes('WBM:DONE')) {
                // console.log("Got Done")
                exit({})
            } else exit({}, new Error('Unexpected Response in sendDone'))
        }
        const timer = setTimeout(() => exit({}, new Error('sendDone timed out')), 1000);
        port.on('data', handleData)
        port.write('WBM:DONE')
    })
}

const sendPages = async(pages) => {
    let pagesSent = 0;
    await pages.reduce(async(acc, thePage) => {
        try {
            await acc
            await sendPage(thePage)
            pagesSent++
        } catch (error) {
            throw error
        }
    }, Promise.resolve([]))
    console.log("Sent", pagesSent, "pages")
    return true
}

const writeMcuFlash = async(data) => {
    return new Promise(async(resolve, reject) => {
        try {
            console.log("In writeMcuFlash")
            const { pageSize, availableSpace } = await getDeviceInfo()
            console.log('Got Info | Page Size =', pageSize, "| Available Space =", availableSpace)

            if (data.length > availableSpace) reject(new Error('Sequence will not fit in EEPROM'))

            let pages = makePages(data, pageSize)

            // send program command
            // console.log("Sending program command")
            await sendProgramCommand()
            console.log("Sent Program Command")

            // send pages
            await sendPages(pages)
            console.log('Sent Pages')

            // send done
            await sendDone()

            console.log("Upload is done")
            resolve()

        } catch (error) {
            throw error
        }
    })
}

const makePages = (data, pageSize) => {
    let pages = []
    let page = []
    data.forEach(byte => {
        page.push(byte)
        if (page.length === pageSize) {
            pages.push(page)
            page = []
        }
    })
    while (page.length < pageSize) page.push(0xFF)
    pages.push(page)
    console.log("Prepared", pages.length, "pages")
    return pages
}

const getDeviceInfo = async() => {
    return new Promise(async(resolve, reject) => {

        const exit = (data, err) => {
            clearInterval(timer)
            port.removeListener('data', handleData)
            if (err !== undefined) {
                throw err
                reject(err)
            } else resolve(data)
        }
        const handleData = (data) => {
            console.log("-------------------------------------")
            console.log(data.toString())
            if (data.toString().includes('WBM:FLASHINFO')) {
                console.log("Got Device Info")
                const pageSize = (data[data.length - 2] << 8) | data[data.length - 1]
                const availableSpace = (data[data.length - 6] << 24) | (data[data.length - 5] << 16) | (data[data.length - 4] << 8) | data[data.length - 3]
                exit({ pageSize, availableSpace })
            } else exit({}, new Error(`Unexpected data in getDeviceInfo ${data.toString()}`))

        }
        const timer = setTimeout(() => exit({}, new Error('getDeviceInfo timed out')), 1000);
        port.on('data', handleData)
        port.write('WBM:GETFLASHINFO', () => console.log("Wrote WBM:GETFLASHINFO"))
    })
}

const upload = async(data) => {
    return new Promise(async(resolve, reject) => {
        try {
            console.log("in Upload")
            const send = await writeMcuFlash(data)
            console.log('Upload Complete')
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}

const uploadFirmware = async() => {
    const res = await dialog.showOpenDialog(win, {
        title: 'Upload Firmware',
        filters: [{ name: 'Binary File', extensions: ['bin'] }]
    })
    if (res.canceled === true) return false
    const pathToFile = normalize(res.filePaths[0])
    console.log(pathToFile)
    const file = readFileSync(pathToFile)


    try {
        await upload(file)
    } catch (error) {
        throw error
    }


    return true
}

const initIpcHandlers = () => {
    ipcMain.on('uploadFirmware', () => uploadFirmware())

    ipcMain.on('upload', async(e, actions) => {
        if (port) {
            const sequenceArray = generateSequenceArray(prepareActions(actions))
            try {
                await upload(sequenceArray)
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
        if (port) {
            // console.log("Send Serial", data)
            port.write(new Buffer.from(data), (err) => { if (err) console.log(err) })
        }
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