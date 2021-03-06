import { ILog, Log } from './log';
import { IParams, ug } from './ug';
import { existsSync, readFileSync, statSync, unlinkSync } from 'fs';
import { open } from 'fs/promises';

const defMaxLogSize = 10 * 1024 * 1024;

const f = async () => {
  const paramsFile = process.argv[2];

  if (!paramsFile || !existsSync(paramsFile)) {
    console.error('Full name of the file with build process parameters must be specified as a first command line argument.');
  } else {
    const params = JSON.parse(readFileSync(paramsFile, {encoding:'utf8', flag:'r'})) as IParams;
    const logBuffer: string[] = [];

    const loggers: ILog[] = [{
      log: (color: number | undefined, ...messages: string[]) => {
        const s = messages.join('\n').trimRight();

        if (s) {
          if (color === undefined) {
            console.log(s)
          } else {
            console.log(`\x1b[${color}m${s}\x1b[0m`);
          }

          logBuffer.push(s);
        }
      }
    }];

    await ug(params, new Log(loggers));

    if (params.logFile) {
      if (existsSync(params.logFile)) {
        if (statSync(params.logFile).size > (params.maxLogSize ?? defMaxLogSize)) {
          try {
            unlinkSync(params.logFile);
          } catch {
            //...
          }
        }
      }

      try {
        const fh = await open(params.logFile, 'a');
        await fh.appendFile(logBuffer.join('\n'));
        await fh.close();
      } catch (e) {
        console.error(`Error opening log file: ${e}`);
      }
    }
  }
};

f();
