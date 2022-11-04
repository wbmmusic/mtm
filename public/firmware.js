const { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')
const { downloadFirmware, getDevices, getLatest, getLines, setBase } = require('wbm-version-manager')
const { pathToFirmwareFolder } = require('./utils')

setBase('http://versions.wbmtek.com/api')

const checkForFirmwareUpdates = async() => {
    return new Promise(async(resolve, reject) => {
        try {
            const lines = await getLines()
            const lineID = lines.find(line => line.name === "MTM").id
            const devices = await getDevices(lineID)
            console.log(pathToFirmwareFolder)
            devices.forEach(device => {
                const pathToDeviceFolder = join(pathToFirmwareFolder, device.path)
                if (!existsSync(pathToDeviceFolder)) mkdirSync(pathToDeviceFolder)
            });

            for (let i = 0; i < devices.length; i++) {
                // check for latest
                const pathToDeviceFolder = join(pathToFirmwareFolder, devices[i].path)
                const latest = await getLatest(lineID, devices[i].id)
                if (latest) {
                    console.log(latest)
                    if (readdirSync(pathToDeviceFolder).includes(latest.name)) {
                        console.log("Up To Date")
                    } else {
                        const folderContents = readdirSync(pathToDeviceFolder)
                            // delete all folder contents
                        folderContents.forEach(file => rmSync(join(pathToDeviceFolder, file)))

                        const download = await downloadFirmware(latest.id, join(pathToDeviceFolder, latest.name))
                        writeFileSync(join(pathToDeviceFolder, 'latest.json'), JSON.stringify(latest, null, '  '))
                    }
                }
            }
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = { checkForFirmwareUpdates }