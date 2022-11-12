const { dialog } = require('electron');
const { SerialPort } = require('serialport');
const { usb } = require('usb');
const { join } = require('node:path');
const { compareToLatest } = require('./firmware');
const { pathToFirmwareFolder } = require('./utils');
const { existsSync, readFileSync } = require('node:fs');
const { spawn } = require('node:child_process')
const EventEmitter = require('node:events');

const bootEmitter = new EventEmitter()

const usbTarget = [
    { vid: 0x2341, pid: 0x0043 },
    { vid: 0x03EB, pid: 0x2404 }
]

const defaultBootloader = { waiting: false, serialNumber: '' }

let bootloader = {...defaultBootloader }

global.connectedDeviceInfo = null

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

const streamMsg = new Buffer.from('WBM:STREAM')
const sendStream = (data) => {
    const dataBuf = new Buffer.from(data)
    const out = new Buffer.concat([streamMsg, dataBuf])
    port.write(out), (err) => { if (err) console.log(err) }
}

const usbStatus = () => {
    if (connectedDeviceInfo) {
        win.webContents.send('usb_status', true)
        return true
    } else {
        win.webContents.send('usb_status', false)
        return false
    }
}

const getConnectedDeviceInfo = async(port, serialNumber, path) => {
    return new Promise(async(resolve, reject) => {
        const exit = (err) => {
            clearTimeout(timeout)
            port.removeListener('data', handleData)
            if (err) {
                reject(err)
            } else resolve()
        }

        const handleData = (data) => {
            const pairs = data.toString().split(";")
            out = { serialNumber, path }
            pairs.forEach(pair => {
                const keyVal = pair.split(':')
                out[keyVal[0]] = keyVal[1]
            })
            this.connectedDeviceInfo = out
            exit()
        }

        let timeout = setTimeout(() => {
            exit(new Error("Timed Out Waiting For Device Info"))
        }, 1000);

        port.on('data', handleData)

        port.write('WBM:GETINFO')
    })
}

const openPort = async() => {
    // console.log("Try to open port")
    let port = null
    let result = {}
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
                port = new SerialPort({ path: thePorts[0].path, baudRate: 9600 })
                port.on('open', async() => {
                    // console.log('PORT OPENED') //

                    if (thePorts[0].serialNumber.includes("BOOT:")) {
                        this.connectedDeviceInfo = {
                            path: thePorts[0].path,
                            serialNumber: thePorts[0].serialNumber,
                            model: "mtm2s"
                        }
                        result = { mode: 'bootloader' }
                        port.close()
                    } else {
                        win.webContents.send('usb_status', true)
                        await getConnectedDeviceInfo(port, thePorts[0].serialNumber, thePorts[0].path)
                        compareToLatest()
                        result = { mode: 'normal' }
                        port.close()
                    }
                })
                port.on('close', () => {
                    port = null
                    console.log("Port Closed")
                    resolve(result)
                })
                port.on('error', (err) => {
                    port = null
                    this.connectedDeviceInfo = null
                    console.error("PORT ERROR", err)
                    reject(err)
                })
            } else reject("Didn't Find target Device")
        } catch (error) {
            reject(error)
        }
    })
}

const sendBootToBootloader = async() => {
    console.log("Boot To Bootloader", this.connectedDeviceInfo.path)
    return new Promise(async(resolve, reject) => {
        let port = new SerialPort({ path: this.connectedDeviceInfo.path, baudRate: 115200 })
        const serial = this.connectedDeviceInfo.serialNumber.split(':')[1]

        let result = null

        port.on('open', () => {
            console.log("Port Opened")
            const exit = (err) => {
                clearTimeout(timeout)
                bootEmitter.removeListener('bootloaderDeviceConnected', handleEvent)
                port.removeListener('data', handleData)
                if (err) {
                    result = err
                    port.close()
                } else {
                    bootloader.waiting = true
                    bootloader.serialNumber = serial
                    port.destroy()
                    resolve()
                }
            }

            const handleData = (data) => {
                if (data.toString() === "WBM:BOOT") { console.log("Got This Message in boot to bootloader", data.toString()) }
            }

            const handleEvent = serialNumber => {
                if (serialNumber.includes(serial)) exit()
                else exit(new Error('Bootloader device serial is not what was expected'))
            }

            const timeout = setTimeout(() => {
                exit(new Error('Timed Out sending boot to bootloader'))
            }, 3000);

            port.on('data', handleData)

            bootEmitter.on('bootloaderDeviceConnected', handleEvent)

            port.write('WBM:BOOTLOADER', () => console.log("Sent Boot To Bootloader"))
        })

        port.on('close', () => {
            if (result) {
                console.log(result)
                reject(result)
            }
        })

        port.on('error', (err) => {
            console.log(err)
            reject(err)
        })

    })

}

const upload = async(pathToFile) => {
    console.log("UPLOAD")
    return new Promise(async(resolve, reject) => {
        try {
            // console.log("in Upload")

            const config = {
                path: this.connectedDeviceInfo.path,
                pathToFile: pathToFile.toString()
            }

            const args = [new Buffer.from(JSON.stringify(config))]

            const pathToUploader = join(__dirname, '..', '..', 'mtm-serial-port', 'release', 'mtm-serial-port-macos')

            console.log("SPAWNING")
            const uploader = spawn(pathToUploader, [...args])

            uploader.stdout.on('data', (data) => {
                console.log(data.toString())
            })

            uploader.stderr.on('data', (data) => console.error(data.toString()))

            uploader.on('close', (code) => {
                console.log("Close code", code)
                if (code === 0) resolve()
                else reject()
            })

        } catch (error) {
            console.log(error)
            reject(error)
        }
    })
}

const handleFirmwareUpload = async(pathToFile) => {
    console.log("Handle Firmware Upload")
    return new Promise(async(resolve, reject) => {
        // Connected device is not in bootloader mode TYPICAL
        if (!this.connectedDeviceInfo.serialNumber.includes('BOOT:')) {
            // Just confirm that serial number does contain WBM:
            if (this.connectedDeviceInfo.serialNumber.includes('WBM:')) {
                try {
                    console.log("-------------- START UPLOAD FIRMWARE --------------")
                    win.webContents.send('upload_progress', { show: true, value: null })
                    await sendBootToBootloader()
                    await upload(pathToFile)
                    win.webContents.send('upload_progress', { show: false, value: null })
                    console.log("-------------- END UPLOAD FIRMWARE --------------")
                    resolve()
                } catch (error) {
                    reject(error)
                }
            } else {
                reject(new Error('Something is wrong with the serial number of this device'))
            }

            // Device is in bootloader mode... user should confirm what the connected device is for proper firmware
        } else {
            console.log("-------------- START UPLOAD FIRMWARE FROM BOOTLOADER --------------")
            console.log('Device is in bootloader mode,  Fix this')
            try {
                win.webContents.send('upload_progress', { show: true, value: null })
                await upload(pathToFile)
                win.webContents.send('upload_progress', { show: false, value: null })
                console.log("-------------- END UPLOAD FIRMWARE FROM BOOTLOADER --------------")
                resolve()
            } catch (error) {
                reject(error)
            }
        }
    })


}

const uploadCustomFirmware = async() => {
    console.log("Upload Custom Firmware")
    const res = await dialog.showOpenDialog(win, {
        title: 'Upload Firmware',
        filters: [{ name: 'Binary File', extensions: ['bin'] }]
    })
    if (res.canceled === true) return false
    const pathToFile = normalize(res.filePaths[0])
    console.log(pathToFile)

    win.webContents.send('upload_progress', { show: true, value: null })
    try {
        await handleFirmwareUpload(pathToFile)
    } catch (error) {
        throw error
    }

    win.webContents.send('upload_progress', { show: false, value: null })

    return true
}

const uploadFirmware = async() => {
    console.log("Upload Latest Firmware")
    const pathToDeviceFolder = join(pathToFirmwareFolder, this.connectedDeviceInfo.model.toLowerCase())
    if (!existsSync(pathToDeviceFolder)) throw new Error("Folder Doesn't Exist")
    const devLatest = JSON.parse(readFileSync(join(pathToDeviceFolder, 'latest.json')))
    const pathToLatestFirmwareFile = join(pathToDeviceFolder, devLatest.name)

    await handleFirmwareUpload(pathToLatestFirmwareFile)

    return true
}

const tryToSetDeviceAsConnectedDevice = async() => {
    return new Promise(async(resolve, reject) => {
        try {
            const deviceState = await openPort()
            console.log(deviceState)
            if (deviceState.mode === 'bootloader') {
                win.webContents.send('usb_status', true)
                bootEmitter.emit('bootloaderDeviceConnected', this.connectedDeviceInfo.serialNumber)
            } else if (deviceState.mode === 'normal') {
                win.webContents.send('usb_status', true)
            } else {
                reject(new Error('Unknown Device Mode'))
            }
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}

const initUSB = () => {
    usb.on('attach', async(e) => {
        const vid = e.deviceDescriptor.idVendor
        const pid = e.deviceDescriptor.idProduct
        for (let i = 0; i < usbTarget.length; i++) {
            // If this devices PID and VID match ones we are looking for
            if (vid === usbTarget[i].vid && pid === usbTarget[i].pid) {
                console.log("Device was attached")
                    // try to get some info from it
                try {
                    const info = await tryToSetDeviceAsConnectedDevice()
                    console.log(info)
                } catch (error) {
                    console.log(error)
                }
            }
        }
    })

    usb.on('detach', (e) => {
        const vid = e.deviceDescriptor.idVendor
        const pid = e.deviceDescriptor.idProduct
        for (let i = 0; i < usbTarget.length; i++) {
            if (vid === usbTarget[i].vid && pid === usbTarget[i].pid) {
                console.log("Device was detached")
                this.connectedDeviceInfo = null
                break
            }
        }
    })

    // tryToOpenPort()
}

module.exports = { initUSB, upload, uploadCustomFirmware, uploadFirmware, sendStream, usbStatus }