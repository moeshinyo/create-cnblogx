import { Command } from 'commander';
import path from 'path';
import fsp from 'fs/promises'
import fs from 'fs'
import fsx from 'fs-extra'
import process, { exit } from 'process';
import chalk from 'chalk';
import ora from 'ora';


async function main(opt_name?: string) {
    let src: string;
    let dst: string;
    let project_name: string;

    await doSomething('Checking directories', async () => {
        src = path.resolve(__dirname, '../starters/cnblogx-starter');

        if (!fs.existsSync(src)) {
            internalError(`wrong starter path: '${src}'`);
        }

        [dst, project_name] = await ensureDest(opt_name);
    });
    
    await doSomething('Copying files', async () => {
        await copyProject(src, dst);
    });
    
    await doSomething('Initializing metadata', async () => {
        const path_config = path.resolve(dst, 'package.json');
        const config = (await fsp.readFile(path_config)).toString();
        await fsp.writeFile(path_config, config.replace('\"cnblogx-starter\"', JSON.stringify(project_name)));
    });

    printGuide(project_name);
}

async function ensureDest(project_name?: string): Promise<[string, string]> {
    const dst = project_name !== undefined ?
        path.resolve(process.cwd(), project_name)
        : process.cwd();

    try {
        const stat = await fsp.stat(dst, );

        if (!stat.isDirectory()) {
            fatalError('Target directory is not a directory. ');
        }

    } catch (_)  {
        try {
            await fsp.mkdir(dst);
        } catch (_) {
            fatalError('Failed to resolve target directory. ');
        }
    }
    
    if ((await fsp.readdir(dst)).length > 0) {
        fatalError('Target directory is not empty. ');
    }

    return [dst, path.basename(dst)];
}

async function copyProject(src: string, dst: string): Promise<void> {
    try {
        await fsx.copy(src, dst, {
            overwrite: true, 
        });
    } catch (_) {
        fatalError(`Failed to copy template files from '${src}' to '${dst}'. `);
    }
}

function fatalError(info: string): never {
    console.log(chalk.red('Fatal Error: '), info, '\n');
    process.exit(-1)
}

async function doSomething(desc: string, thing:  () => Promise<boolean | void>): Promise<void> {
    const dots = ora(desc).start();
    const res = await thing();

    if (res === true || res === undefined) {
        dots.succeed(`${desc}... Done`);
    } else {
        dots.fail();
    }
}

function internalError(code: string): never {
    fatalError(`An internal error (${code}) occured, this is a bug.`)
}

function printGuide(opt_name?: string) {
    console.log("Now run: \n");
    printCode(`cd ${opt_name}`, opt_name !== undefined);
    printCode(`npm install (or \`yarn install\`)`);
    printCode(`npm run dev (or \`yarn dev\`)`);
    console.log("\n");
}

function printCode(cmd: string, cond: boolean = true, indent: number = 4) {
    if (!cond) {
        return;
    }
    console.log(`${' '.repeat(indent)}%s`, cmd);
}

new Command()
    .name('create-cnblogx')
    .description('CLI to start a new customization script project for cnblogs. ')
    .version('1.0.0')
    .argument('[project-name]', 'name of the new project')
    .action(async (project_name?: string) => {
        await main(project_name);
    })
    .parse();
