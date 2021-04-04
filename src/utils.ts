import { ExecSyncOptions, ExecFileSyncOptions, execFileSync } from 'child_process';
import { Log } from './log';
import { IParams } from './types';
import path from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

export const bindLog = (params: IParams, log: Log) => ({
  /** Обертка процесса
    *  @param name имя процесса
    *  @param fn функция
    *  @param skip пропустить выполнение
    */
  runProcess: async (name: string, fn: () => void, skip = false) => {
    if (skip) {
      log.log(`skipped ${name}...`);
    } else {
      log.startProcess(name);
      await fn();
      log.finishProcess();
    };
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
