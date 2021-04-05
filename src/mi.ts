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
import { existsSync, unlinkSync, copyFileSync, statSync } from 'fs';
import path from 'path';
import { Log } from './log';
import { portableFilesList, projects, instFilesList, instProjects } from './const';
import { IParams } from './types';
import { basicCmdOptions, basicExecOptions, bindLog } from './utils';

/**
 * Главная функция.
 * @param log Логгер.
 */
 export async function mi(params: IParams, log: Log) {

  const { runProcesses, packFiles, deleteFile, assureFileDir, assureDir } = bindLog(params, log);

  const { rootGedeminDir, baseDir, instDir, settingDir, distribDir, archiveDir,
    binFirebird, binInnoSetup, fbConnect, fbUser, fbPassword } = params;

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

    assureDir(pathInstDB);

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
        assureFileDir(fDest);
        copyFileSync(fSrc, fDest);
        log.log(`file ${fDest} has been added...`);
      };
    });
  };

  /** Создание истоляции */
  const makeInstallation = (project: ProjectID) => () => {
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

  runProcesses('Gedemin installation', [
    { name: 'Check prerequisites', fn: checkPrerequisites },
    { name: 'Prepare installation', fn: prepareInstallation },
    ...miProjectList.flatMap( pr => ({ name: 'Make installation', fn: makeInstallation(pr) }) ),
  ]);
};
