/**
 * Текущий функционал
 *    Обновление файлов для истоляции из целевой папки компиляции
 *    Копирование эталонной БД в БД проекта истоляции
 *    -Загрузка пакета настроек
 *    -Бэкап БД проекта истоляции
 *    -Создание установчного файла
 *    -Создание архива установчного файла
 */

import { execFileSync, execSync, ExecFileSyncOptions, ExecSyncOptions } from 'child_process';
import {
  existsSync, readFileSync, readdirSync, unlinkSync, copyFileSync, writeFileSync,
  statSync, appendFileSync, createReadStream, mkdirSync
} from 'fs';
import path from 'path';
import { Log } from './log';
import { portableFilesList, projects, instFilesList, instProjects } from './const';
import FormData from 'form-data';

export interface IParams {
  /**
   * Корневая папка с полными исходниками Гедымина.
   * В ней находятся папки Comp5 и Gedemin.
   */
  rootGedeminDir: string;
  /** Папка архива */
  archiveDir: string;
  /** Папка БД */
  baseDir: string;
  /** Папка файлов для инстоляции */
  instDir: string;
  /** Папка дистрибутивов */
  distribDir: string;
  /** Папка настроек */
  settingDir: string;
  /** Папка Firebird */
  binFirebird: string;
  /** Папка WinRAR */
  binWinRAR: string;
  /** Папка InnoSetup */
  binInnoSetup: string;
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
 export async function mi(params: IParams, log: Log) {

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
    rootGedeminDir, baseDir, instDir, settingDir, distribDir, archiveDir,
    binFirebird, binWinRAR, binInnoSetup, upload,
    fbConnect, fbUser, fbPassword
  } = params;

  /** Папка ISS-файлов для создания истоляции */
  const pathISS = path.join(rootGedeminDir, 'Gedemin', 'Setup', 'InnoSetup');
  /** Папка файлов БД для создания истоляции */
  const pathInstDB = path.join(instDir, 'database');

  const basicExecOptions: ExecFileSyncOptions = {
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 64,
    timeout: 1 * 60 * 60 * 1000
  };

  const basicCmdOptions: ExecSyncOptions = {
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 64,
    timeout: 1 * 60 * 60 * 1000
  };

  const packFiles = (arcName: string, fileName: string, cwd: string) => log.log(
    execFileSync(path.join(binWinRAR, 'WinRAR.exe'),
      [ 'a', '-ep', '-u', '-as', '-ibck', arcName, fileName ],
      { ...basicExecOptions, cwd }).toString()
  );

  const deleteFile = (fn: string, msg?: string) => {
    if (existsSync(fn)) {
      unlinkSync(fn);
      msg && log.log(msg);
    }
  };

  const assureDir = (destFullFileName: string) => {
    const { dir } = path.parse(destFullFileName);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      log.log(`directory ${dir} has been created...`);
    };
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
        assureDir(fDest);
        copyFileSync(fSrc, fDest);
        log.log(`file ${fDest} has been added...`);
      };
    });
  };

  /** Создание истоляции */
  const makeInstallation = (project: ProjectID) => {
    const dbFileName = 'etalon.fdb';
    const dbFullFileName = path.join(baseDir, dbFileName);
    const dbProjectFullFileName = path.join(pathInstDB, `${project}.fdb`);

    /** Копирование эталонной БД в БД проекта истоляции */
    deleteFile(dbProjectFullFileName, `previous ${project}.fdb has been deleted...`);
    copyFileSync(dbFullFileName, dbProjectFullFileName);
    log.log(`${dbProjectFullFileName} has been copied from ${dbFullFileName}`);

    /** Загрузка пакета настроек */
    const connectionString = `${fbConnect ?? 'localhost/3050'}${fbConnect ? ':' : ''}${dbProjectFullFileName}`;
    const settingFullFileName = path.join(settingDir, instProjects[project].FSFN);
    let opt = { ...basicExecOptions, cwd: instDir };
    log.log(
      execFileSync(
        path.join(instDir, 'gedemin.exe'),
        [ '/sn', connectionString, '/user', 'Administrator', '/password', 'Administrator',
          '/sp', settingDir, '/rd', '/q', '/sl',
          '/sfn', settingFullFileName, '/ns' ],
        opt).toString()
    );
    log.log(`${settingFullFileName} has been loaded...`);

    const imgSrcFullFileName = path.join(rootGedeminDir, 'Gedemin', 'Images', 'Splash', instProjects[project].SFN);
    const imgDestFullFileName = path.join(instDir, 'gedemin.jpg');
    deleteFile(imgDestFullFileName, `previous gedemin.jpg has been deleted...`);
    copyFileSync(imgSrcFullFileName, imgDestFullFileName);
    log.log(`${imgDestFullFileName} has been copied from ${imgSrcFullFileName}`);

    const bkProjectFullFileName = path.join(pathInstDB, `${project}.bk`);
    deleteFile(bkProjectFullFileName, `previous ${bkProjectFullFileName} has been deleted...`);
    execFileSync(
      path.join(binFirebird, 'gbak.exe'),
      [ '-b', connectionString, bkProjectFullFileName,
        '-user', fbUser ?? 'SYSDBA', '-pas', fbPassword ?? 'masterkey' ],
      opt);
    log.log(`${bkProjectFullFileName} has been created...`);

    const setupPath = path.join(distribDir, instProjects[project].TFN);
    const setupFullFileName = path.join(setupPath, 'setup.exe');
    deleteFile(setupFullFileName, `previous ${setupFullFileName} has been deleted...`);

    const issFileName = instProjects[project].IFN + '.iss';
    const issFullFileName = path.join(pathISS, issFileName);
    opt = { ...basicExecOptions, cwd: pathISS };
    // not works
    // execFileSync(
    //   path.join(binInnoSetup, 'iscc.exe'),
    //   [`"${issFullFileName}" /O"${setupPath}" /Fsetup /Q`],
    //   opt);

    execSync(
      `"${path.join(binInnoSetup, 'iscc.exe')}"` +
      ` "${issFullFileName}" /O"${setupPath}" /Fsetup /Q`,
      basicCmdOptions);
    log.log(`Project ${project} has been distributed into ${setupPath}`);

    const arcFullFileName = path.join(archiveDir, instProjects[project].AFN);
    packFiles(arcFullFileName, setupFullFileName, distribDir);
    log.log(`Project ${project} has been packed into ${arcFullFileName}`);

    };

  /** Список проектов для инстоляции */
  type ProjectID = 'business' | 'devel';
  const miProjectList: ProjectID[] = [/*'business',*/ 'devel'];

  /** Количество шагов процесса */
  const steps = 1 + miProjectList.length * 1;

  /** Начало процесса */
  log.startProcess('Gedemin installation', steps);

  log.log(`Read params: ${JSON.stringify(params, undefined, 2)}`);
  log.log(`Gedemin root dir: ${rootGedeminDir}`);
  log.log(`Database dir: ${baseDir}`);
  log.log(`Installation dir: ${instDir}`);

  await runProcess('Check prerequisites', checkPrerequisites);
  await runProcess('Prepare installation', prepareInstallation);

  for (const pr of miProjectList) {
    await runProcess('Make installation', () => makeInstallation(pr));
  };

  /** Окончание процесса */
  log.finishProcess();
};
