import { execFileSync, ExecFileSyncOptions } from 'child_process';
import {
  existsSync, readFileSync, readdirSync, unlinkSync, copyFileSync, writeFileSync,
  statSync, appendFileSync, createReadStream, mkdirSync
} from 'fs';
import path from 'path';
import { Log } from './log';
import {
  gedeminCfgTemplate, gedeminCfgVariables, gedeminSrcPath, gedeminCompilerSwitch,
  gedeminArchiveName, portableFilesList, projects, gedeminSQL, instFilesList
} from './const';
import FormData from 'form-data';

export interface IParamsInst {
  /**
   * Корневая папка с полными исходниками Гедымина.
   * В ней находятся папки Comp5 и Gedemin.
   */
  rootGedeminDir: string;
  /** Папка БД */  
  baseDir: string;
  /** Папка файлов для инстоляции */
  instDir: string;
  /** Папка Firebird */
  binFirebird: string;
  /** Upload files to web site */
  upload?: boolean;
  /** */
  logFile?: string;
  /** */
  maxLogSize?: number;
  /** Строка подключения к серверу файреберд. Имя сервера и порт. По-умолчанию localhost/3050 */
  fbConnect?: string;
  /** Имя пользователя для подключения к серверу файреберд. По-умолчанию, SYSDBA */
  fbUser?: string;
  /** Пароль пользователя файреберд */
  fbPassword?: string;
};

/**
 * Главная функция.
 * @param log Логгер.
 */
 export async function ug(params: IParamsInst, log: Log) {

  /** Обертка процесса
   *  @param name имя процесса
   *  @param fn функция
   *  @param skip пропустить выполнение
   */
  const runProcess = async (name: string, fn: () => void, skip = false) => {
    if (skip) {
      log.log(`skipped ${name}...`);
    } else {
      log.startProcess(name);

      try {
        await fn();
      } catch(e) {
        log.error(e.message);
        process.exit(1);
      };

      log.finishProcess();
    };
  };

  const {
    rootGedeminDir, baseDir, instDir,
    binFirebird, upload,
    fbConnect, fbUser, fbPassword
  } = params;

  /** Папка ISS-файлов для создания истоляции */
  const pathISS = path.join(rootGedeminDir, 'Setup', 'InnoSetup');
  /** Папка файлов БД для создания истоляции */
  const pathInstDB = path.join(instDir, 'database');

  const basicExecOptions: ExecFileSyncOptions = {
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 64,
    timeout: 5 * 60 * 1000
  };

  const deleteFile = (fn: string, msg?: string) => {
    if (existsSync(fn)) {
      unlinkSync(fn);
      msg && log.log(msg);
    }
  };

  /** Проверяем наличие необходимых файлов, программ, папок */
  const checkPrerequisites = () => {
    if (!baseDir || !existsSync(baseDir)) {
      throw new Error(`Database dir "${baseDir}" not found!`);
    }

    if (!instDir || !existsSync(instDir)) {
      throw new Error(`Installation dir "${instDir}" not found!`);
    }

    if (!existsSync(pathInstDB)) {
      mkdirSync(pathInstDB);
      log.log(`directory ${pathInstDB} has been created...`);
    }

    log.log('everything is ok!');
  };

  /** Подготовка к истоляции */
  const prepareInstallation = () => {
    /** Целевая папка компиляции */
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', projects['gedemin'].dest ?? 'EXE');
    /** Обновление файлов для создания истоляции */
    portableFilesList.forEach( fn => {
      const fSrc = path.join(pathEXE, fn);
      const fDest = path.join(instDir, fn);
      if (existsSync(fDest)) {
        if (instFilesList.includes(fn) && (statSync(fSrc).ctimeMs > statSync(fDest).ctimeMs)) {
          unlinkSync(fDest);
          copyFileSync(fSrc, fDest);
          log.log(`file ${fDest} has been updated...`);
        };
      } else {
        copyFileSync(fSrc, fDest);
        log.log(`file ${fDest} has been added...`);
      };
    });
  };

  /** Создание истоляций */
  const makeInstallation = (inst: InstID) => {
    log.log(`makeInstallation ${inst}`);
  };

  /** Список проектов для инстоляции */
  type InstID = 'business' | 'devel';
  const ugInstList: InstID[] = ['business', 'devel'];

  /** Количество шагов процесса */
  const steps = 1 + ugInstList.length * 1;

  /** Начало процесса */
  log.startProcess('Gedemin installation', steps);

  log.log(`Read params: ${JSON.stringify(params, undefined, 2)}`);
  log.log(`Gedemin root dir: ${rootGedeminDir}`);
  log.log(`Database dir: ${baseDir}`);
  log.log(`Installation dir: ${instDir}`);  

  await runProcess('Check prerequisites', checkPrerequisites);
  await runProcess('Prepare installation', prepareInstallation);

  for (const inst of ugInstList) {  
    await runProcess('', () => makeInstallation(inst)); 
  };

  /** Окончание процесса */
  log.finishProcess();
};
