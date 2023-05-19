const net = require('net');
const port = process.env.PORT ? (process.env.PORT - 100) : 5000;

process.env.ELECTRON_START_URL = `http://localhost:${port}`;



const startElectron = () => {
    console.log('starting electron');
    startedElectron = true;
    const exec = require('child_process').exec;
    var electron = exec('yarn run electron');

    electron.stdout.on('data', (data) => console.log(data));
    electron.stdout.on('error', (data) => console.log("ER", data));
    // electron.stderr.on('data', (data) => console.log("E", data));
}

let startedElectron = false;
const tryConnection = () => {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.connect({ port: port, host: '127.0.0.1' })
        client.on('connect', () => {
            client.end();
            if (!startedElectron) {
                startElectron()
                resolve(true)
            }
            resolve(true)
        })
        client.on('error', () => {
            client.destroy()
            resolve(false)
        })
    })

};


let timer = setInterval(async () => {
    const running = await tryConnection()
    if (running) clearInterval(timer)
}, 1000);