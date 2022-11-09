const { dialog } = require('electron');
const { SerialPort } = require('serialport');
const { usb } = require('usb');
const { join } = require('node:path');
const { compareToLatest } = require('./firmware');
const { pathToFirmwareFolder } = require('./utils');
const { existsSync, readFileSync } = require('node:fs');
const EventEmitter = require('node:events');


const bootEmitter = new EventEmitter()

const usbTarget = [
    { vid: 0x2341, pid: 0x0043 },
    { vid: 0x03EB, pid: 0x2404 }
]

const defaultBootloader = { waiting: false, serialNumber: '' }

let bootloader = {...defaultBootloader }

global.connectedDeviceInfo = null
global.port = null // The serialport for the connected device

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

const getConnectedDeviceInfo = async(serialNumber) => {
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
            out = { serialNumber }
            pairs.forEach(pair => {
                const keyVal = pair.split(':')
                out[keyVal[0]] = keyVal[1]
            })
            connectedDeviceInfo = out
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
                port.on('open', async() => {
                    // console.log('PORT OPENED') //

                    if (thePorts[0].serialNumber.includes("BOOT:")) {
                        connectedDeviceInfo = {
                            serialNumber: thePorts[0].serialNumber,
                            model: "mtm2s"
                        }
                        bootEmitter.emit('bootloaderDeviceConnected', thePorts[0].serialNumber)
                        resolve(true)
                    } else {
                        win.webContents.send('usb_status', true)
                        await getConnectedDeviceInfo(thePorts[0].serialNumber)
                        compareToLatest()
                        resolve(true)
                    }
                })
                port.on('close', () => {
                    port = null
                    console.log("Port Closed")
                    connectedDeviceInfo = null
                    win.webContents.send('usb_status', false)
                })
                port.on('error', (err) => { console.error(err) })
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
        console.log("Error on 1st attempt to connect", error)
        setTimeout(async() => {
            try {
                await openPort()
            } catch (error) {
                console.log("Error on 2nd attempt to connect", error)
            }
        }, 1000);
    }

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
            } else exit({}, new Error("Didn't get expected response in sendProgramCommand"))
        }
        const timer = setTimeout(() => exit({}, new Error('sendProgramCommand timed out')), 1000);
        port.on('data', handleData)
        port.write('WBM:LOAD')
    })
}

const olsendPage = async(page) => {
    console.log('Send Page')
    return new Promise(async(resolve, reject) => {
        const exit = (err) => {
            console.log("Send Page exit", err)
            clearInterval(timer)
            port.removeListener('data', handleData)
            if (err) reject(err)
            else resolve()
        }

        const handleData = (data) => {
            console.log('handleData', data.length)
            if (JSON.stringify([...data]) === JSON.stringify([...page])) {
                exit()
            } else {
                exit(new Error('Page Mismatch in sendPage'))
            }
        }

        // console.log("Send Page")
        let timer = setTimeout(() => exit(new Error('sendPage timed out')), 1000);
        // console.log('Sending Page', page.length)
        port.on('data', handleData)
        port.write(new Buffer.from(page))
    })

}

const sendHalfPage = async(pageHalf, half) => {
    // console.log('Send Page Half', half)
    return new Promise(async(resolve, reject) => {
        const exit = (err) => {
            // console.log("Send Page exit", err)
            clearInterval(timer)
            port.removeListener('data', handleData)
            if (err) reject(err)
            else resolve()
        }

        const handleData = (data) => {
            // console.log('handleData', data.length)
            if (JSON.stringify([...data]) === JSON.stringify([...pageHalf])) {
                exit()
            } else {
                exit(new Error('Page Mismatch in sendPage'))
            }
        }

        // console.log("Send Page")
        let timer = setTimeout(() => exit(new Error('sendPage timed out')), 1000);
        // console.log('Sending Page', page.length)
        port.on('data', handleData)
        if (half === 0) {
            const msg = new Buffer.from("WBM:PAGE0")
            port.write(Buffer.concat([msg, new Buffer.from(pageHalf)]))
        } else {
            const msg = new Buffer.from("WBM:PAGE1")
            port.write(Buffer.concat([msg, new Buffer.from(pageHalf)]))
        }

    })
}

const sendPage = async(page) => {
    // page.forEach((byte, idx) => console.log(idx, byte))
    return new Promise(async(resolve, reject) => {
        try {
            await sendHalfPage(page.slice(0, 32), 0)
            await sendHalfPage(page.slice(32, 64), 1)
            setTimeout(() => {
                resolve()
            }, 1);
        } catch (error) {
            reject(error)
        }
    })

}

const sendDone = async() => {
    console.log('Send Done')
    return new Promise(async(resolve, reject) => {
        const exit = (err) => {
            console.log("Exit done", err)
            clearInterval(timer)
            if (port) port.removeListener('data', handleData)
            if (err) reject(err)
            else resolve()
        }
        const handleData = (data) => {
            console.log("Done Data", data.toString())
            if (data.toString().includes('WBM:DONE')) {
                // console.log("Got Done")
                exit()
            } else exit(new Error('Unexpected Response in sendDone'))
        }
        const timer = setTimeout(() => exit(new Error('sendDone timed out')), 1000);
        port.on('data', handleData);
        port.write('WBM:DONE', (err) => {
            if (err) exit(error)
            else console.log("WROTE DONE")
        })
    })
}

const sendBootToBootloader = async() => {
    const serial = connectedDeviceInfo.serialNumber.split(':')[1]
    return new Promise(async(resolve, reject) => {
        const exit = (err) => {
            clearTimeout(timeout)
            bootEmitter.removeListener('bootloaderDeviceConnected', handleEvent)
            port.removeListener('data', handleData)
            if (err) reject(err)
            else {
                bootloader.waiting = true
                bootloader.serialNumber = serial
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

}

const sendPages = async(pages) => {
    return new Promise(async(resolve, reject) => {
        let pagesSent = 0;
        win.webContents.send('upload_progress', { show: true, value: 0 })
        await pages.reduce(async(acc, thePage) => {
            try {
                await acc
                await sendPage(thePage)
                    // console.log("Sent Page", pagesSent)
                pagesSent++
                win.webContents.send('upload_progress', { show: true, value: (100 * pagesSent) / pages.length })
            } catch (error) {
                throw error
            }
        }, Promise.resolve([]))
        console.log("Sent", pagesSent, "pages")
        resolve()
    })

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
            reject(error)
        }
    })
}

const makePages = (data, pageSize) => {
    console.log(data.length, "bytes to be packed into pages")
    console.log(data)
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
    console.log("UPLOAD")
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

const handleFirmwareUpload = async(file) => {
    return new Promise(async(resolve, reject) => {
        // Connected device is not in bootloader mode TYPICAL
        if (!connectedDeviceInfo.serialNumber.includes('BOOT:')) {
            // Just confirm that serial number does contain WBM:
            if (connectedDeviceInfo.serialNumber.includes('WBM:')) {
                try {
                    win.webContents.send('upload_progress', { show: true, value: null })
                    await sendBootToBootloader()
                    await upload(file)
                    win.webContents.send('upload_progress', { show: false, value: null })
                    resolve()
                } catch (error) {
                    reject(error)
                }
            } else {
                reject(new Error('Something is wrong with the serial number of this device'))
            }

            // Device is in bootloader mode... user should confirm what the connected device is for proper firmware
        } else {
            console.log('Device is in bootloader mode,  Fix this')
            try {
                win.webContents.send('upload_progress', { show: true, value: null })
                await upload(file)
                win.webContents.send('upload_progress', { show: false, value: null })
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
    const file = readFileSync(pathToFile)

    win.webContents.send('upload_progress', { show: true, value: null })
    await handleFirmwareUpload(file)
    win.webContents.send('upload_progress', { show: false, value: null })

    return true
}

const uploadFirmware = async() => {
    console.log("Upload Latest Firmware")
    const pathToDeviceFolder = join(pathToFirmwareFolder, connectedDeviceInfo.model.toLowerCase())
    if (!existsSync(pathToDeviceFolder)) throw new Error("Folder Doesn't Exist")
    const devLatest = JSON.parse(readFileSync(join(pathToDeviceFolder, 'latest.json')))
    const pathToLatestFirmwareFile = join(pathToDeviceFolder, devLatest.name)
    const file = readFileSync(pathToLatestFirmwareFile)

    await handleFirmwareUpload(file)

    return true
}

const initUSB = () => {
    usb.on('attach', async(e) => {
        const vid = e.deviceDescriptor.idVendor
        const pid = e.deviceDescriptor.idProduct

        for (let i = 0; i < usbTarget.length; i++) {
            if (vid === usbTarget[i].vid && pid === usbTarget[i].pid) {
                console.log("Device was attached")
                if (!port) {
                    tryToOpenPort()
                    break
                } else console.log("Device Attached but another is already connected")
            }
        }

    })

    usb.on('detach', (e) => {
        const vid = e.deviceDescriptor.idVendor
        const pid = e.deviceDescriptor.idProduct
        for (let i = 0; i < usbTarget.length; i++) {
            if (vid === usbTarget[i].vid && pid === usbTarget[i].pid) {
                console.log("Device was detached")
                if (port) {
                    connectedDeviceInfo = null
                    if (port) port.close()
                    break
                }
            }
        }
    })

    tryToOpenPort()
}

module.exports = { initUSB, upload, uploadCustomFirmware, uploadFirmware, port }