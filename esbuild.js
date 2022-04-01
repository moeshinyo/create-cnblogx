const fs = require('fs/promises');
const esbuild = require('esbuild');

const script = esbuild.buildSync({
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    platform: 'node',
    write: false,
    target: ['node14']
});

(async () => {
    await fs.rm('dist', { recursive: true, force: true });
    await fs.mkdir('dist');
    await fs.writeFile('dist/index.js', `#!/usr/bin/env node\n${script.outputFiles[0].text}`);
})();
