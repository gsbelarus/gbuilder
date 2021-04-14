import { ExecSyncOptions, ExecFileSyncOptions, execFileSync } from 'child_process';
import { Log } from './log';
import { IParams, Processes } from './types';
import path from 'path';
import { existsSync, mkdirSync, unlinkSync, createReadStream } from 'fs';
import { copyFile, stat } from 'fs/promises';
import FormData from 'form-data';
import { InstProject, instProjects } from './const';

export const bindLog = (params: IParams, log: Log) => ({
  runProcesses: async (name: string, processes: Processes) => {
    log.startProcess(name, processes.length);
    for (const { name, fn } of processes) {
      log.startProcess(name);
      await fn();
      log.finishProcess();
    }
    log.finishProcess();
  },

  packFiles: (arcName: string, fileName: string, cwd: string, msg?: string) => {
    if (existsSync(arcName)) {
      unlinkSync(arcName);
    }

    const s = execFileSync(path.join(params.binWinRAR, 'WinRAR.exe'),
      [ 'a', '-u', '-as', '-ibck', arcName, fileName ],
      { ...basicExecOptions, cwd }).toString().trim();
    s && log.log(s);

    if (existsSync(arcName)) {
      log.log(msg || `archive ${arcName} has been created...`);
    } else {
      throw new Error(`Can not create archive ${arcName}!`);
    };
  },

  deleteFile: (fn: string, msg?: string) => {
    if (existsSync(fn)) {
      unlinkSync(fn);
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
    await copyFile(src, dest);
    const { size } = await stat(dest);
    log.log(`copied: ${src} --> ${dest}, ${size.toLocaleString(undefined, { maximumFractionDigits: 0 })} bytes...`);
  },

  uploadFile: async (fn: string, url: string) => {
    const form = new FormData();
    const size = (await stat(fn)).size;

    form.append('data', createReadStream(fn), {
      filename: path.basename(fn),
      filepath: fn,
      contentType: 'application/zip',
      knownLength: size
    });

    log.log(`uploading ${fn}...`)

    // исходники PHP скриптов приведены в папке PHP
    await new Promise( res => form.submit(url, res) );

    log.log(`${fn} has been uploaded via ${url}, ${size.toLocaleString(undefined, { maximumFractionDigits: 0 })} bytes...`)
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

export const basicExecOptions: ExecFileSyncOptions = {
  stdio: ['pipe', 'pipe', 'pipe'],
  maxBuffer: 1024 * 1024 * 64,
  timeout: 1 * 60 * 60 * 1000
};

export const basicCmdOptions: ExecSyncOptions = {
  stdio: ['pipe', 'pipe', 'pipe'],
  maxBuffer: 1024 * 1024 * 64,
  timeout: 1 * 60 * 60 * 1000
};

export const getLogFileName = (dir: string) => path.join(dir, 'log.txt');
