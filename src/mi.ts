/**
 * Текущий функционал
 *    Обновление файлов для истоляции из целевой папки компиляции
 *    Копирование эталонной БД в БД проекта истоляции
 *    -Загрузка пакета настроек
 *    -Бэкап БД проекта истоляции
 *    -Создание установчного файла
 *    -Создание архива установчного файла
 */

import { existsSync } from 'fs';
import { unlink, rm } from 'fs/promises';
import path from 'path';
import { Log } from './log';
import { portableFilesList, instProjects, etalonDBFileName, getFBConnString, InstProject, cashPortableFilesList, IInstProject, buildProjects } from './const';
import { IParams } from './types';
import { basicExecOptions, bindLog, execFileAsync, execAsync } from './utils';
import { ug } from './ug';

async function _mi(params: IParams, log: Log) {

  const { runProcesses, packFiles, deleteFile, assureDir, copyFileWithLog,
    uploadFile, filterProjectList } = bindLog(params, log);

  const { rootGedeminDir, settingDir, ciDir, upload, binFirebird, binInnoSetup,
    fbConnect, fbUser, fbPassword, srcGedeminAppsBranch, projectList } = params;

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

    if (!projectList || !projectList.length) {
      throw new Error(`Project list is not set!`);
    }

    assureDir(pathInstDB);
    assureDir(archiveDir);
    assureDir(instDir);

    log.log('everything is ok!');
  };

  /** Снятие из гита последних исходников */
  const pullSources = async () => {
    const opt = { ...basicExecOptions, cwd: settingDir };
    log.log(`git stash...`);
    log.log((await execFileAsync('git', ['stash'], opt)).stdout);
    log.log(`git checkout ${srcGedeminAppsBranch}...`);
    log.log((await execFileAsync('git', ['checkout', srcGedeminAppsBranch], opt)).stdout);
    log.log(`git pull...`);
    log.log((await execFileAsync('git', ['pull'], opt)).stdout);
  };

  /** Копируем все файлы из EXE в папку, из которой будем создавать инстоляцию InnoSetup */
  const prepareInstallation = (project: InstProject) => async () => {
    const { copyCashFiles } = instProjects[project];
    if (existsSync(instDir)) {
      await rm(instDir, { recursive: true });
      log.log(`Directory ${instDir} has been removed...`);
    }
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', 'EXE');
    return Promise.all([...portableFilesList, ...(copyCashFiles ? cashPortableFilesList : [])].map(
      fn => copyFileWithLog(path.join(pathEXE, fn), path.join(instDir, fn))
    ) );
  };

  /** Создание истоляции */
  const makeInstallation = (project: InstProject) => async () => {
    const { FSFN, SFN, TFN, IFN, AFN, setupFileName, demoBk } = instProjects[project];
    const dbFullFileName = path.join(baseDir, etalonDBFileName);
    const dbProjectFullFileName = path.join(pathInstDB, `${project}.fdb`);

    /** Копирование демо БД в папку проекта истоляции */
    if (demoBk) {
      await copyFileWithLog(path.join(baseDir, demoBk), path.join(pathInstDB, demoBk));
    }

    /** Копирование эталонной БД в БД проекта истоляции */
    await copyFileWithLog(dbFullFileName, dbProjectFullFileName);

    /** Загрузка пакета настроек */
    const connectionString = getFBConnString(fbConnect, dbProjectFullFileName);
    const settingFullFileName = path.join(settingDir, FSFN);
    const s = (await execFileAsync(
      path.join(instDir, 'gedemin.exe'),
      [ '/sn', connectionString, '/user', 'Administrator', '/password', 'Administrator',
        '/sp', settingDir, '/rd', '/q',
        '/sfn', settingFullFileName, '/ns' ],
      { ...basicExecOptions, cwd: instDir })).stdout.trim();
    s && log.log(s);
    log.log(`${settingFullFileName} has been loaded...`);

    const imgSrcFullFileName = path.join(rootGedeminDir, 'Gedemin', 'Images', 'Splash', SFN);
    const imgDestFullFileName = path.join(instDir, 'gedemin.jpg');
    await copyFileWithLog(imgSrcFullFileName, imgDestFullFileName);

    const bkProjectFullFileName = path.join(pathInstDB, `${project}.bk`);
    await deleteFile(bkProjectFullFileName);
    log.log(
      (await execFileAsync(
        path.join(binFirebird, 'gbak.exe'),
        [ '-b', connectionString, bkProjectFullFileName,
          '-user', fbUser ?? 'SYSDBA', '-pas', fbPassword ?? 'masterkey', '-g' ],
        { ...basicExecOptions, cwd: instDir })).stdout
    );
    log.log(`${bkProjectFullFileName} has been created...`);

    const outputName = setupFileName || 'setup';
    const setupPath = path.join(distribDir, TFN);
    const setupFullFileName = path.join(setupPath, outputName + '.exe');

    const issFileName = IFN + '.iss';
    const output = (await execAsync(
      `"${path.join(binInnoSetup, 'iscc.exe')}" /O"${setupPath}" /F${outputName} /Q /DGedInstDir="${instDir}" ${issFileName}`, {
      maxBuffer: 1024 * 1024 * 64,
      timeout: 1 * 60 * 60 * 1000,
      cwd: pathISS
    })).stdout.trim();
    output && log.log(output);
    log.log(`setup file ${setupFullFileName} has been created...`);

    const arcFullFileName = path.join(archiveDir, AFN + '.rar');
    await packFiles(arcFullFileName, setupFullFileName, distribDir);

    // portable archive
    Promise.all(
      [`Database/${project}.bk`, 'gedemin.ini', 'databases.ini']
        .map( f => path.join(instDir, f) )
        .filter( f => existsSync(f) )
        .map( f => unlink(f) )
    );

    const portableArcFullFileName = path.join(archiveDir, project + '_portable.rar');
    await packFiles(portableArcFullFileName, 'Gedemin', ciDir);

    if (upload) {
      await Promise.all([
        uploadFile(arcFullFileName, 'http://gsbelarus.com/gs/content/upload.php'),
        uploadFile(portableArcFullFileName, 'http://gsbelarus.com/gs/content/upload.php')
      ]);
    } else {
      log.log('skip uploading...');
    }

    log.log(`Project "${project}" has been successfully built 🎆`, { bot: true });
  };

  const filtered = filterProjectList(projectList);

  await runProcesses(`Gedemin installation for projects: ${filtered.join(', ')}`, [
    { name: 'Check prerequisites', fn: checkPrerequisites },
    { name: 'Pull sources', fn: pullSources },
    ...filtered.flatMap( pr => ([
      { name: `Prepare installation: ${pr}`, fn: prepareInstallation(pr) },
      { name: `Make installation: ${pr}`, fn: makeInstallation(pr) }
    ]) ),
  ]);
};

export async function mi(params: IParams, log: Log) {
  const getSign = ({ buildParams: { exeSize, customRcFile, cfgVariables } }: IInstProject) => `${cfgVariables.cond}${exeSize}${customRcFile}`;

  const sorted = params.projectList
    .filter( pr => {
      if (instProjects[pr]) {
        return true;
      } else {
        console.error(`Unknown project ${pr}!`);
        return false;
      }
    })
    .sort( (a, b) => getSign(instProjects[a]).localeCompare(getSign(instProjects[b])) );

  const projectList: InstProject[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const pr = sorted[i];
    const nextPr = sorted[i + 1];
    const instProject = instProjects[pr];
    const nextProject = nextPr && instProjects[nextPr];

    projectList.push(pr);

    if (!nextPr || getSign(instProject) !== getSign(nextProject)) {
      const { buildParams } = instProject;

      await ug({ ...params, upload: false, buildParams: { ...buildParams, incBuildNumber: false, commitBuildNumber: false } }, log);
      await _mi({ ...params, projectList }, log);
      projectList.length = 0;
    }
  }
};
