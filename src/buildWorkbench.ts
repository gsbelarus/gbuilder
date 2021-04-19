import { ILog, Log } from './log';
import { existsSync, readFileSync, statSync } from 'fs';
import { open } from 'fs/promises';
import { BuildFunc, IParams } from './types';
import { getLogFileName } from './utils';

const defMaxLogSize = 10 * 1024 * 1024;

/**
 * Функция организует загрузку параметров, инициализацию лога ивызов функции компиляции.
 * @param ug Функция компиляции проекта.
 */
export const buildWorkbench = async (ug: BuildFunc, augParams?: Partial<IParams>) => {
  const paramsFile = process.argv[2];
  let res = false;

  if (!paramsFile || !existsSync(paramsFile)) {
    console.error('Full name of the file with build process parameters must be specified as a first command line argument.');
  } else {
    let params: IParams;

    try {
      params = JSON.parse(readFileSync(paramsFile, {encoding:'utf8', flag:'r'})) as IParams;
    } catch(e) {
      throw new Error(`Error parsing JSON file ${paramsFile}. ${e}`);
    }

    if (augParams) {
      params = { ...params, ...augParams };
    }

    if (!params.compilationType) {
      params.compilationType = 'PRODUCT';
    }

    for (let i = 3; i < process.argv.length; i++) {
      const p = process.argv[i].toUpperCase();
      console.info('Compilation parameter overriden through command line: ',
        p === 'DEBUG'
          ? params.compilationType = 'DEBUG'
          : p === 'LOCK'
          ? params.compilationType = 'LOCK'
          : p
      );
    }

    const logBuffer: string[] = [];

    const loggers: ILog[] = [
      {
        log: (message, meta) => {
          const s = message.trimRight();

          if (s) {
            if (meta?.type === 'ERROR') {
              console.log(`\x1b[31m${s}\x1b[0m`);
            }
            else if (meta?.header) {
              console.log(`\x1b[33m${s}\x1b[0m`);
            }
            else {
              console.log(s)
            }
          }
        }
      },
      {
        log: (message) => logBuffer.push(message)
      }
    ];

    const log = new Log(loggers);

    log.log(`Resulting params: ${JSON.stringify(params, undefined, 2)}`);

    try {
      await ug(params, log);
      res = true;
    } catch(e) {
      log.error(e.message);
    }

    const { ciDir, maxLogSize } = params;
    const logFile = getLogFileName(ciDir);

    if (logFile) {
      if (existsSync(logFile)) {
        if (statSync(logFile).size > (maxLogSize ?? defMaxLogSize)) {
          try {
            let fh = await open(logFile, 'r');
            const buffer = await fh.readFile();
            const data = buffer.toString().split('\n');
            await fh.close();

            const remainder = data.slice(Math.floor( data.length / 2 ));

            fh = await open(logFile, 'w');
            await fh.appendFile(remainder.join('\n'));
            await fh.close();
          } catch {
            //...
          }
        }
      }

      try {
        const fh = await open(logFile, 'a');
        await fh.appendFile('\n' + '=*'.repeat(40) + '\n');
        await fh.appendFile(logBuffer.join('\n'));
        await fh.close();
      } catch (e) {
        console.error(`Error opening log file: ${e}`);
      }
    }
  }

  return res;
};
