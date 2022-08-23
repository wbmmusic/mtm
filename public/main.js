const { app, BrowserWindow, ipcMain, protocol } = require('electron')
const { join } = require('path')
const url = require('url')
const { autoUpdater } = require('electron-updater');
const { SerialPort } = require('serialport');
const { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync, rmdirSync } = require('fs');

let firstReactInit = true

////////////////// App Startup ///////////////////////////////////////////////////////////////////
let win

let ports = []
let port = null
let settings;

const pathToUserData = join(app.getPath('userData'), 'data')
const pathToUserSettings = join(pathToUserData, 'settings.json')
const pathToRobots = join(pathToUserData, 'robots')

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

const makePorts = async() => {
    let tempPorts = await SerialPort.list()
    ports = tempPorts.filter(prt => !prt.path.includes('BLTH') && !prt.path.includes('Bluetooth'))
    console.log("----- PORTS -----")
    ports.forEach((prt, idx) => console.log(idx, "->", prt.path))
    console.log("--- END PORTS ---")
}

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

// Create myWindow, load the rest of the app, etc...
app.on('ready', () => {
        //log("-APP IS READY");
        makePorts()

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
                    ipcMain.on('installUpdate', () => autoUpdater.quitAndInstall())

                    setTimeout(() => autoUpdater.checkForUpdates(), 3000);
                    setInterval(() => autoUpdater.checkForUpdates(), 1000 * 60 * 60);
                }
            }
        })

        ipcMain.handle('openPort', async(e, path) => {
            return new Promise((resolve, reject) => {
                console.log('open', path)
                port = new SerialPort({ path, baudRate: 115200 })
                port.on('open', () => {
                    console.log('PORT OPENED')
                    resolve(true)
                })
            })

        })

        ipcMain.on('play', (e, file) => {
            if (settings.sound) win.webContents.send('play_file', file)
        })

        ipcMain.handle('sound', (e, onOff) => {
            settings.sound = onOff
            saveSettings()
            return settings.sound
        })

        ipcMain.handle('getPorts', async() => await getPorts())

        ipcMain.handle('sendValue', async(e, data) => {
            console.log("Send Serial", data)
            port.write(new Buffer.from(data))
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
                const robotPath = join(pathToRobots, robot.path)
                const robotFilePath = join(robotPath, 'robot.json')
                console.log("Save Robot", robot)
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
                const oldRobotFolderPath = join(pathToRobots, oldPath)

                if (oldPath) {
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

        createWindow()
    })
    ///////////////////////

// Quit when all windows are closed.
app.on('window-all-closed', () => app.quit())

app.on('activate', () => {
    if (win === null) createWindow()
})

////////////////// END App Startup ///////////////////////////////////////////////////////////////