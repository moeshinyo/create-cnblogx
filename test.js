const fs = require('fs/promises');
const child_process = require('child_process');

(async () => {
    await fs.rm('test', { recursive: true, force: true });
    await fs.mkdir('test');

    await new Promise((resolve, reject) => {
        child_process.fork('../dist/index.js',[], {
            cwd: 'test', 
        }).on('exit', (code, signal) => {
            resolve();
        }).on('error', (err) => {
            reject();
        }) 
    });
    
    child_process.fork('../dist/index.js',['first_theme'], {
        cwd: 'test', 
    });
})()
