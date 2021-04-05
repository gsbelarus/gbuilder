import { ILog, Log } from './log';
import { existsSync, readFileSync, statSync, unlinkSync } from 'fs';
import { open } from 'fs/promises';
import { BuildFunc, IParams } from './types';

const defMaxLogSize = 10 * 1024 * 1024;

/**
 * Функция организует загрузку параметров, инициализацию лога ивызов функции компиляции.
 * @param ug Функция компиляции проекта.
 */
export const buildWorkbench = async (ug: BuildFunc) => {
  const paramsFile = process.argv[2];

  if (!paramsFile || !existsSync(paramsFile)) {
    console.error('Full name of the file with build process parameters must be specified as a first command line argument.');
  } else {
    let params;

    try {
      params = JSON.parse(readFileSync(paramsFile, {encoding:'utf8', flag:'r'})) as IParams;
    } catch(e) {
      throw new Error(`Error parsing JSON file ${paramsFile}. ${e}`);
    }

    const logBuffer: string[] = [];

    const loggers: ILog[] = [
      {
        log: (color: number | undefined, ...messages: string[]) => {
          const s = messages.join('\n').trimRight();

          if (s) {
            if (color === undefined) {
              console.log(s)
            } else {
              console.log(`\x1b[${color}m${s}\x1b[0m`);
            }
          }
        }
      },
      {
        log: (_, ...messages: string[]) => messages.forEach( m => logBuffer.push(m) )
      }
    ];

    const log = new Log(loggers);

    log.log(`Read params: ${JSON.stringify(params, undefined, 2)}`);

    try {
      await ug(params, log);
    } catch(e) {
      log.error(e.message);
    }

    const { logFile, maxLogSize } = params;

    if (logFile) {
      if (existsSync(logFile)) {
        if (statSync(logFile).size > (maxLogSize ?? defMaxLogSize)) {
          try {
            unlinkSync(logFile);
          } catch {
            //...
          }
        }
      }

      try {
        const fh = await open(logFile, 'a');
        await fh.appendFile(logBuffer.join('\n'));
        await fh.close();
      } catch (e) {
        console.error(`Error opening log file: ${e}`);
      }
    }
  }
};
