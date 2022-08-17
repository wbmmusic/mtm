const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron')
const { join } = require('path')
const { exec } = require('child_process');
const url = require('url')
const { SerialPort } = require('serialport')

let firstReactInit = true



////////////////// App Startup ///////////////////////////////////////////////////////////////////
let win

let ports = []
let port = null

const makePorts = async() => {
    ports = await SerialPort.list()
    console.log("----- PORTS -----")
    ports.forEach(prt => {
        console.log(prt.path)
    })
    console.log("--- END PORTS ---")
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
        width: 500,
        height: 400,
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

        ipcMain.on('reactIsReady', () => {

            if (firstReactInit === true) {
                firstReactInit = false
                win.webContents.send('ports', ports)
                console.log('React Is Ready')
                if (app.isPackaged) {
                    win.webContents.send('message', 'App is packaged')
                }
            }
        })

        ipcMain.handle('scanFolder', () => {
            const xyz = dialog.showOpenDialogSync(win, {
                properties: ['openDirectory'],
                title: "Choose folder to scan"
            })

            if (xyz !== undefined) return findNodeProjectFolders(xyz[0])
            else return {}
        })

        ipcMain.handle("update", async(e, x) => {
            await update(x);
            return true
        })

        ipcMain.handle('openPort', async(e, prt) => {
            console.log('open', prt)
            port = new SerialPort({ baudRate: 9600, path: prt })
            port.on('open', () => {
                console.log('PORT OPENED')
                return { data: true }
            })
        })

        ipcMain.handle('sendValue', async(e, ch, val) => {
            console.log("Channel", ch, "Val", val)
        })
        createWindow()
    })
    ///////////////////////

// Quit when all windows are closed.
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})

////////////////// END App Startup ///////////////////////////////////////////////////////////////