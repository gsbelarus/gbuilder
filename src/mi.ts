/**
 * Текущий функционал
 *    Обновление файлов для истоляции из целевой папки компиляции
 *    Копирование эталонной БД в БД проекта истоляции
 *    -Загрузка пакета настроек
 *    -Бэкап БД проекта истоляции
 *    -Создание установчного файла
 *    -Создание архива установчного файла
 */

import { execFileSync, execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { Log } from './log';
import { portableFilesList, instProjects } from './const';
import { IParams } from './types';
import { basicExecOptions, bindLog } from './utils';

/**
 * Главная функция.
 * @param log Логгер.
 */
 export async function mi(params: IParams, log: Log) {

  const { runProcesses, packFiles, deleteFile, assureDir, copyFileWithLog } = bindLog(params, log);

  const { rootGedeminDir, baseDir, instDir, settingDir, distribDir, archiveDir,
    binFirebird, binInnoSetup, fbConnect, fbUser, fbPassword, srcGedeminAppsBranch } = params;

  /** Папка ISS-файлов для создания истоляции */
  const pathISS = path.join(rootGedeminDir, 'Gedemin', 'Setup', 'InnoSetup');
  /** Папка файлов БД для создания истоляции */
  const pathInstDB = path.join(instDir, 'database');

  /** Проверяем наличие необходимых файлов, программ, папок */
  const checkPrerequisites = () => {
    if (!baseDir || !existsSync(baseDir)) {
      throw new Error(`Database dir "${baseDir}" not found!`);
    }

    if (!instDir || !existsSync(instDir)) {
      throw new Error(`Installation dir "${instDir}" not found!`);
    }

    if (!settingDir || !existsSync(settingDir)) {
      throw new Error(`Directory with name spaces files "${settingDir}" not found!`);
    }

    assureDir(pathInstDB);

    log.log('everything is ok!');
  };

  /** Снятие из гита последних исходников */
  const pullSources = () => {
    const opt = { ...basicExecOptions, cwd: settingDir };
    log.log(`git checkout ${srcGedeminAppsBranch}...`);
    log.log(execFileSync('git', ['checkout', srcGedeminAppsBranch], opt).toString());
    log.log(`git pull...`);
    log.log(execFileSync('git', ['pull'], opt).toString());
  };

  /** Копируем все файлы из EXE в папку, из которой будем создавать инстоляцию InnoSetup */
  const prepareInstallation = () => {
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', 'EXE');
    return Promise.all(portableFilesList.map( fn => copyFileWithLog(path.join(pathEXE, fn), path.join(instDir, fn)) ) );
  };

  /** Создание истоляции */
  const makeInstallation = (project: ProjectID) => async () => {
    const dbFileName = 'etalon.fdb';
    const dbFullFileName = path.join(baseDir, dbFileName);
    const dbProjectFullFileName = path.join(pathInstDB, `${project}.fdb`);

    /** Копирование эталонной БД в БД проекта истоляции */
    deleteFile(dbProjectFullFileName, `previous ${project}.fdb has been deleted...`);
    await copyFileWithLog(dbFullFileName, dbProjectFullFileName);

    /** Загрузка пакета настроек */
    const connectionString = `${fbConnect ?? 'localhost/3050'}${fbConnect ? ':' : ''}${dbProjectFullFileName}`;
    const settingFullFileName = path.join(settingDir, instProjects[project].FSFN);
    let opt = { ...basicExecOptions, cwd: instDir };
    log.log(
      execFileSync(
        path.join(instDir, 'gedemin.exe'),
        [ '/sn', connectionString, '/user', 'Administrator', '/password', 'Administrator',
          '/sp', settingDir, '/rd', '/q',
          '/sfn', settingFullFileName, '/ns' ],
        opt).toString()
    );
    log.log(`${settingFullFileName} has been loaded...`);

    const imgSrcFullFileName = path.join(rootGedeminDir, 'Gedemin', 'Images', 'Splash', instProjects[project].SFN);
    const imgDestFullFileName = path.join(instDir, 'gedemin.jpg');
    deleteFile(imgDestFullFileName, `previous gedemin.jpg has been deleted...`);
    await copyFileWithLog(imgSrcFullFileName, imgDestFullFileName);

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
    log.log(
      execSync(
        `"${path.join(binInnoSetup, 'iscc.exe')}" /O"${setupPath}" /Fsetup /Q ${issFileName}`, {
          maxBuffer: 1024 * 1024 * 64,
          timeout: 1 * 60 * 60 * 1000,
          cwd: pathISS
        }).toString()
    );
    log.log(`Project ${project} has been distributed into ${setupPath}`);

    const arcFullFileName = path.join(archiveDir, instProjects[project].AFN);
    packFiles(arcFullFileName, setupFullFileName, distribDir);
    log.log(`Project ${project} has been packed into ${arcFullFileName}`);
  };

  /** Список проектов для инстоляции */
  type ProjectID = 'business' | 'devel';
  const miProjectList: ProjectID[] = [/*'business',*/ 'devel'];

  await runProcesses('Gedemin installation', [
    { name: 'Check prerequisites', fn: checkPrerequisites },
    { name: 'Pull sources', fn: pullSources },
    { name: 'Prepare installation', fn: prepareInstallation },
    ...miProjectList.flatMap( pr => ({ name: 'Make installation', fn: makeInstallation(pr) }) ),
  ]);
};
