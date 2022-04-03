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

    await doSomething('检查项目元数据', async () => {
        if (!await checkName(opt_name)) {
            fatalError(`项目名称不合法。`);
        }
    });

    await doSomething('建立项目文件夹', async () => {
        src = path.resolve(__dirname, '../starters/cnblogx-starter');

        if (!fs.existsSync(src)) {
            internalError(`wrong starter path: '${src}'`);
        }

        [dst, project_name] = await ensureDest(opt_name);
    });
    
    await doSomething('复制文件', async () => {
        await copyProject(src, dst);
    });
    
    await doSomething('初始化项目元数据', async () => {
        const path_config = path.resolve(dst, 'package.json');
        const config = (await fsp.readFile(path_config)).toString();
        await fsp.writeFile(path_config, config.replace('\'cnblogx-starter\'', JSON.stringify(project_name)));
    });

    printGuide(opt_name);
}

async function checkName(opt_name?: string): Promise<boolean> {
    if (typeof opt_name === 'string') {
        return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(opt_name);
    }
    return true;
}

async function ensureDest(project_name?: string): Promise<[string, string]> {
    const dst = project_name !== undefined ?
        path.resolve(process.cwd(), project_name)
        : process.cwd();

    try {
        const stat = await fsp.stat(dst, );

        if (!stat.isDirectory()) {
            fatalError('目标文件夹已被占用。');
        }

    } catch (_)  {
        try {
            await fsp.mkdir(dst);
        } catch (_) {
            fatalError('建立项目文件夹失败。');
        }
    }
    
    if ((await fsp.readdir(dst)).length > 0) {
        fatalError('目标文件夹已存在且非空。');
    }

    return [dst, path.basename(dst)];
}

async function copyProject(src: string, dst: string): Promise<void> {
    try {
        await fsx.copy(src, dst, {
            overwrite: true, 
        });
    } catch (_) {
        fatalError(`复制文件失败（'${src}' -> '${dst}'）。`);
    }
}

function fatalError(info: string): never {
    console.log(chalk.red('致命错误: '), info, '\n');
    process.exit(-1)
}

async function doSomething(desc: string, thing:  () => Promise<boolean | void>): Promise<void> {
    const dots = ora(`${desc}...\n`).start();
    const res = await thing();

    if (res === true || res === undefined) {
        dots.succeed(`${desc}... 完成`);
    } else {
        dots.fail();
    }
}

function internalError(code: string): never {
    fatalError(`出现了一个内部错误 (${code})，这是一个Bug，欢迎反馈。`)
}

function printGuide(opt_name?: string) {
    console.log('现在可以尝试: \n');
    printCode(`cd ${opt_name}`, opt_name !== undefined);
    printCode(`npm install (或 \`yarn install\`)`);
    printCode(`npm run dev (或 \`yarn dev\`)`);
    console.log('\n');
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
    .argument('[project-name]', 'name of the new project')
    .action(async (project_name?: string) => {
        await main(project_name);
    })
    .parse();
