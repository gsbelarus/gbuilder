import { ExecSyncOptions } from 'child_process';
import { ExecFileSyncOptions } from 'child_process';
import { Log } from './log';

/** Обертка процесса
  *  @param name имя процесса
  *  @param fn функция
  *  @param skip пропустить выполнение
  */
export const prepareRunProcess = (log: Log) => async (name: string, fn: () => void, skip = false) => {
  if (skip) {
    log.log(`skipped ${name}...`);
  } else {
    log.startProcess(name);
    await fn();
    log.finishProcess();
  };
};

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
