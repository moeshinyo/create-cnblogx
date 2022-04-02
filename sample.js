const fs = require('fs/promises');
const child_process = require('child_process');

(async () => {
    await fs.rm('sample', { recursive: true, force: true });
    await fs.mkdir('sample');

    await new Promise((resolve, reject) => {
        child_process.fork('../dist/index.js',[], {
            cwd: 'sample', 
        }).on('exit', (code) => {
            resolve(code);
        }).on('error', (err) => {
            reject(err);
        }) 
    });

    child_process.fork('../dist/index.js',['redheme'], {
        cwd: 'sample', 
    });
    
})()
