import { ExecSyncOptions, ExecFileSyncOptions, execFileSync } from 'child_process';
import { Log } from './log';
import { IParams, Processes } from './types';
import path from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { copyFile, stat } from 'fs/promises';

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

  packFiles: (arcName: string, fileName: string, cwd: string) => log.log(
    execFileSync(path.join(params.binWinRAR, 'WinRAR.exe'),
      [ 'a', '-u', '-as', '-ibck', arcName, fileName ],
      { ...basicExecOptions, cwd }).toString()
  ),

  deleteFile: (fn: string, msg?: string) => {
    if (existsSync(fn)) {
      unlinkSync(fn);
      msg && log.log(msg);
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
    await copyFile(src, dest);
    const { size } = await stat(dest);
    log.log(`copied: ${src} --> ${dest}, ${size.toLocaleString(undefined, { maximumFractionDigits: 0 })} bytes...`);
  }
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