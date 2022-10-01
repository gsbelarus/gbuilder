import { execFile, exec, ExecFileOptions, ExecOptions } from 'child_process';
import { Log } from './log';
import { IParams, Processes } from './types';
import path from 'path';
import { existsSync, mkdirSync, createReadStream } from 'fs';
import { copyFile, stat, unlink } from 'fs/promises';
import FormData from 'form-data';
import { InstProject, instProjects } from './const';
import { promisify } from 'util';

export const execFileAsync = promisify(execFile);
export const execAsync = promisify(exec);

export const sleep = (ms: number) => new Promise( resolve => setTimeout(resolve, ms) );

export const bindLog = (params: IParams, log: Log) => ({
  runProcesses: async (name: string, processes: Processes) => {
    log.startProcess(name, processes.length);
    for (const { name, fn } of processes) {
      log.startProcess(name);
      await fn();
      log.finishProcess();
    }
    log.finishProcess(true);
  },

  packFiles: async (arcName: string, fileOrDirName: string, cwd: string, msg?: string) => {
    if (existsSync(arcName)) {
      log.log(`previous archive ${arcName} found...`);
      await unlink(arcName);
      log.log(`previous archive ${arcName} has been deleted...`);
    } else {
      log.log(`previous archive ${arcName} is absent...`);
    }

    try {
      const s = (await execFileAsync(path.join(params.binWinRAR, 'WinRAR.exe'),
        [ 'a', '-u', '-as', '-ibck', arcName, fileOrDirName ],
        { ...basicExecOptions, cwd })).stdout.trim();
      s && log.log(s);
    } catch(e) {
      log.error(e.message);
    }

    if (existsSync(arcName)) {
      log.log(msg || `archive ${arcName} has been created...`);
    } else {
      log.error(`archive ${arcName} has not been created...`);
    };
  },

  deleteFile: async (fn: string, msg?: string) => {
    if (existsSync(fn)) {
      await unlink(fn);
      log.log(msg || `${fn} has been deleted...`);
    }
  },

  assureFileDir: (destFullFileName: string) => {
    const { dir } = path.parse(destFullFileName);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      log.log(`directory ${dir} has been created...`);
    };
  },

  assureDir: (dir: string) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      log.log(`directory ${dir} has been created...`);
    };
  },

  copyFileWithLog: async (src: string, dest: string) => {
    const { dir } = path.parse(dest);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    };
    const op = existsSync(dest) ? 'overwritten' : 'copied';
    let firstTry = true;
    // у нас параллельно гедымин может этот файл пытаться отослать по сети
    while (true) {
      try {
        await copyFile(src, dest);
        break;
      } catch (err) {
        if (firstTry) {
          firstTry = false;
          log.log(`probably file ${dest} is held by another process...`)
          log.log(err.message);
          log.log('will make second attempt in 30 sec...')
          await sleep(30000);
        } else {
          log.error(`can't copy file ${dest}...`)
          log.error(err.message);
          return;
        }
      }
    }
    const { size } = await stat(dest);
    log.log(`${op}: ${src} --> ${dest}, ${size.toLocaleString(undefined, { maximumFractionDigits: 0 })} bytes...`);
  },

  uploadFile: async (fn: string, url: string) => {
    if (!existsSync(fn)) {
      log.error(`file to upload ${fn} not found...`);
      return;
    }

    const form = new FormData();
    const size = (await stat(fn)).size;

    form.append('data', createReadStream(fn), {
      filename: path.basename(fn),
      filepath: fn,
      contentType: 'application/zip',
      knownLength: size
    });

    log.log(`uploading ${fn}, ${size.toLocaleString(undefined, { maximumFractionDigits: 0 })} bytes...`)

    // исходники PHP скриптов приведены в папке PHP
    try {
      await new Promise( res => form.submit(url, res) );
      log.log(`${fn} has been uploaded via ${url}...`)
    } catch (e) {
      log.error(e.message);
    }
  },

  filterProjectList: (projectList: InstProject[]) => projectList.filter( pr => {
    if (instProjects[pr]) {
      return true;
    } else {
      log.error(`Unknown project ${pr}!`);
      return false;
    }
  })
});

export const basicExecOptions: ExecFileOptions = {
  maxBuffer: 1024 * 1024 * 64,
  timeout: 1 * 60 * 60 * 1000
};

export const basicCmdOptions: ExecOptions = {
  maxBuffer: 1024 * 1024 * 64,
  timeout: 1 * 60 * 60 * 1000
};

export const getLogFileName = (dir: string) => path.join(dir, 'log.txt');
