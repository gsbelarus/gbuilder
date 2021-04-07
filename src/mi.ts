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
import { existsSync, rmdirSync, unlinkSync } from 'fs';
import path from 'path';
import { Log } from './log';
import { portableFilesList, instProjects, etalonDBFileName, getFBConnString, InstProject } from './const';
import { IParams } from './types';
import { basicExecOptions, bindLog } from './utils';

/**
 * Главная функция.
 * @param log Логгер.
 */
 export async function mi(params: IParams, log: Log) {

  const { runProcesses, packFiles, deleteFile, assureDir, copyFileWithLog, uploadFile } = bindLog(params, log);

  const { rootGedeminDir, settingDir, ciDir, upload,
    binFirebird, binInnoSetup, fbConnect, fbUser, fbPassword, srcGedeminAppsBranch } = params;

  /** Папка ISS-файлов для создания истоляции */
  const pathISS = path.join(rootGedeminDir, 'Gedemin', 'Setup', 'InnoSetup');
  /** Папка файлов БД для создания истоляции */
  const instDir = path.join(ciDir, 'Gedemin');
  /** Папка файлов БД для создания истоляции */
  const pathInstDB = path.join(instDir, 'Database');
  /** */
  const baseDir = path.join(ciDir, 'Database');
  /** */
  const distribDir = path.join(ciDir, 'Distrib');
  /** */
  const archiveDir = path.join(ciDir, 'Archive');

  /** Проверяем наличие необходимых файлов, программ, папок */
  const checkPrerequisites = () => {
    if (!baseDir || !existsSync(baseDir)) {
      throw new Error(`Database dir "${baseDir}" not found!`);
    }

    if (!settingDir || !existsSync(settingDir)) {
      throw new Error(`Directory with name spaces files "${settingDir}" not found!`);
    }

    assureDir(pathInstDB);
    assureDir(archiveDir);
    assureDir(instDir);

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
    if (existsSync(instDir)) {
      rmdirSync(instDir, { recursive: true });
      log.log(`Directory ${instDir} has been removed...`);
    }
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', 'EXE');
    return Promise.all(portableFilesList.map( fn => copyFileWithLog(path.join(pathEXE, fn), path.join(instDir, fn)) ) );
  };

  /** Создание истоляции */
  const makeInstallation = (project: InstProject) => async () => {
    const dbFullFileName = path.join(baseDir, etalonDBFileName);
    const dbProjectFullFileName = path.join(pathInstDB, `${project}.fdb`);

    /** Копирование эталонной БД в БД проекта истоляции */
    await copyFileWithLog(dbFullFileName, dbProjectFullFileName);

    /** Загрузка пакета настроек */
    const connectionString = getFBConnString(fbConnect, dbProjectFullFileName);
    const settingFullFileName = path.join(settingDir, instProjects[project].FSFN);
    log.log(
      execFileSync(
        path.join(instDir, 'gedemin.exe'),
        [ '/sn', connectionString, '/user', 'Administrator', '/password', 'Administrator',
          '/sp', settingDir, '/rd', '/q',
          '/sfn', settingFullFileName, '/ns' ],
        { ...basicExecOptions, cwd: instDir }).toString()
    );
    log.log(`${settingFullFileName} has been loaded...`);

    const imgSrcFullFileName = path.join(rootGedeminDir, 'Gedemin', 'Images', 'Splash', instProjects[project].SFN);
    const imgDestFullFileName = path.join(instDir, 'gedemin.jpg');
    await copyFileWithLog(imgSrcFullFileName, imgDestFullFileName);

    const bkProjectFullFileName = path.join(pathInstDB, `${project}.bk`);
    deleteFile(bkProjectFullFileName);
    log.log(
      execFileSync(
        path.join(binFirebird, 'gbak.exe'),
        [ '-b', connectionString, bkProjectFullFileName,
          '-user', fbUser ?? 'SYSDBA', '-pas', fbPassword ?? 'masterkey', '-g', '-z' ],
        { ...basicExecOptions, cwd: instDir }).toString()
    );
    log.log(`${bkProjectFullFileName} has been created...`);

    const setupPath = path.join(distribDir, instProjects[project].TFN);
    const setupFullFileName = path.join(setupPath, 'setup.exe');

    const issFileName = instProjects[project].IFN + '.iss';
    log.log(
      execSync(
        `"${path.join(binInnoSetup, 'iscc.exe')}" /O"${setupPath}" /Fsetup /Q /DGedInstDir="${instDir}" ${issFileName}`, {
          maxBuffer: 1024 * 1024 * 64,
          timeout: 1 * 60 * 60 * 1000,
          cwd: pathISS
        }).toString()
    );
    log.log(`setup file ${setupFullFileName} has been created...`);

    const arcFullFileName = path.join(archiveDir, instProjects[project].AFN + '.rar');
    packFiles(arcFullFileName, setupFullFileName, distribDir);

    // portable archive
    [`Database/${project}.bk`, 'gedemin.ini', 'databases.ini', 'USBPD.DLL', 'PDPosiFlexCommand.DLL', 'PDComWriter.DLL'].forEach(
      f => {
        const fn = path.join(instDir, f);
        if (existsSync(fn)) {
          unlinkSync(fn);
        }
      }
    );

    //TODO: эти файлы оставить только если инстоляция CASH
    // del Gedemin\USBPD.DLL > nul
    // del Gedemin\PDPosiFlexCommand.DLL > nul
    // del Gedemin\PDComWriter.DLL > nul

    const portableArcFullFileName = path.join(archiveDir, project + '_portable.rar');
    packFiles(portableArcFullFileName, 'Gedemin', ciDir);

    if (upload) {
      await Promise.all([
        uploadFile(arcFullFileName, 'http://gsbelarus.com/gs/content/upload.php'),
        uploadFile(portableArcFullFileName, 'http://gsbelarus.com/gs/content/upload.php')
      ]);
    } else {
      log.log('skip uploading...');
    }
  };

  /** Список проектов для инстоляции */
  const miProjectList: InstProject[] = [/*'business',*/ 'devel'];

  await runProcesses('Gedemin installation', [
    { name: 'Check prerequisites', fn: checkPrerequisites },
    { name: 'Pull sources', fn: pullSources },
    { name: 'Prepare installation', fn: prepareInstallation },
    ...miProjectList.flatMap( pr => ({ name: 'Make installation', fn: makeInstallation(pr) }) ),
  ]);
};
