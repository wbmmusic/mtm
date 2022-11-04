const { dialog } = require('electron');
const { SerialPort } = require('serialport');
const { usb } = require('usb');

const usbTarget = [
    { vid: 0x2341, pid: 0x0043 },
    { vid: 0x03EB, pid: 0x2404 }
]

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

const getConnectedDeviceInfo = async() => {
    return new Promise(async(resolve, reject) => {

        const exit = (err) => {
            clearTimeout(timeout)
            port.removeListener('data', handleData)
            if (err) {
                reject(err)
            } else resolve()
        }

        const handleData = (data) => {
            console.log("Connected Device Info", data)
            const pairs = data.toString().split(";")
            out = {}
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
    console.log("Try to open port")
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
                    getConnectedDeviceInfo()
                    resolve(true)
                })
                port.on('close', () => {
                    port = null
                    console.log("Port Closed")
                    connectedDeviceInfo = null
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

const uploadFirmware = async() => {
    console.log("Upload Firmware")
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

const initUSB = () => {
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
                    connectedDeviceInfo = null
                    port.close()
                    break
                }
            }
        }
    })

    tryToOpenPort()
}

module.exports = { initUSB, upload, uploadFirmware, port }