const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron')
const { join } = require('path')
const { exec } = require('child_process');
const url = require('url')

let firstReactInit = true

////////////////// App Startup ///////////////////////////////////////////////////////////////////
let win
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
        width: 900,
        height: 700,
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
        ipcMain.on('reactIsReady', () => {

            if (firstReactInit === true) {
                firstReactInit = false
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

        ipcMain.on('checkForUpdates', async(e, paths) => handleCheckForUpdates(paths))
        ipcMain.on('openInCode', (e, fldrPath) => exec('code .', { cwd: fldrPath }))
        ipcMain.on('openFolder', (e, fldrPath) => shell.openPath(fldrPath))

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