const net = require('net');
const port = process.env.PORT ? (process.env.PORT - 100) : 5000;

process.env.ELECTRON_START_URL = `http://localhost:${port}`;



const startElectron = () => {
    console.log('starting electron');
    startedElectron = true;
    const exec = require('child_process').exec;
    var elctrn = exec('yarn run electron');

    elctrn.stdout.on('data', function(data) {
        console.log(data);
    });

    elctrn.stdout.on('error', function(data) {
        console.log("ER", data);
    });

    // elctrn.stderr.on('data', function(data) {
    //     console.log('ERRRROOOORRRR', data);
    // });
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


let timer = setInterval(async() => {
    const running = await tryConnection()
    if (running) clearInterval(timer)
}, 1000);