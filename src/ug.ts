/**
 * Текущий функционал
 *    Снятие из гита последних исходников
 *    Компиляция нового экзешника заданного типа
 *    Формирование архива по файлу списка
 */

import { existsSync } from 'fs';
import { unlink, copyFile, stat, readdir, appendFile, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { Log } from './log';
import { gedeminCfgTemplate,  gedeminSrcPath, portableFilesList, projects, gedeminSQL, etalonDBFileName, getFBConnString } from './const';
import { IParams } from './types';
import { basicExecOptions, bindLog, execFileAsync } from './utils';

/**
 * Главная функция.
 * @param log Логгер.
 */
export async function ug(params: IParams, log: Log) {

  const { runProcesses, packFiles, deleteFile, assureDir, uploadFile, copyFileWithLog } = bindLog(params, log);
  const {
    buildParams, ciDir, rootGedeminDir, pathDelphi, binEditbin,
    binFirebird, upload, fbConnect, fbUser, fbPassword } = params;
  const {
    srcBranch, commitBuildNumber, distrToFolder, cfgVariables, exeSize, useTDSPack,
    archiveName, gudfArchiveName, etalonArchiveName, dccSwitches, customRcFile, dstDir, label } = buildParams;

  /** В процессе компиляции DCU файлы помещаются в эту папку */
  const pathDCU = path.join(rootGedeminDir, 'Gedemin', 'DCU');
  /** Папка SQL-файлов для создания эталонной БД */
  const pathSQL = path.join(rootGedeminDir, 'Gedemin', 'SQL');
  /** */
  const baseDir = path.join(ciDir, 'Database');
  /** */
  const archiveDir = path.join(ciDir, 'Archive');
  /** Папка SQL-файлов для создания эталонной БД */
  const fullDstDir = path.join(rootGedeminDir, 'Gedemin', dstDir);

  /**
   * Снимаем исходники с гита.
   * как он понимает репозиторий?
   * где логин пароль?
   *
   * если он берет уже из настроенного гита,
   * то надо отразить в инструкции по развертыванию,
   * что гит должен быть настроен, логин пароль введен и т.п.
   */

  /** Проверяем наличие необходимых файлов, программ, папок */
  const checkPrerequisites = () => {
    if (!srcBranch) {
      throw new Error(`Git branch is not specified!`);
    }

    assureDir(pathDCU);
    assureDir(baseDir);
    assureDir(archiveDir);
    assureDir(fullDstDir);

    log.log('everything is ok!');
  };

  /** Снятие из гита последних исходников */
  const pullSources = async () => {
    const opt = { ...basicExecOptions, cwd: rootGedeminDir };

    const res = (await execFileAsync('git', ['status', '-uno'], opt)).stdout.trim();

    if (!res.includes('nothing to commit')) {
      // обычно, незакомиченные изменения это файлы с инкрементированной версией
      // оставшиеся от предыдущего запуска, завершившегося ошибкой
      log.log(res);
      log.log('uncommitted changes will be lost...');
      log.log(`git reset --hard HEAD...`);
      log.log((await execFileAsync('git', ['reset', '--hard', 'HEAD'], opt)).stdout);
    }

    log.log(`git checkout ${srcBranch}...`);
    log.log((await execFileAsync('git', ['checkout', srcBranch], opt)).stdout);
    log.log(`git pull...`);
    log.log((await execFileAsync('git', ['pull'], opt)).stdout);
  };

  /** */
  const pushIncBuildNumber = async () => {
    const opt = { ...basicExecOptions, cwd: rootGedeminDir };
    try {
      if (commitBuildNumber) {
        log.log(`git commit -a -m "Inc build number"...`);
        log.log((await execFileAsync('git', ['commit', '-a', '-m', 'Inc build number'], opt)).stdout);
        log.log(`git push...`);
        const s = (await execFileAsync('git', ['push'], opt)).stdout.trim();
        s && log.log(s);
      } else {
        // discard local changes to derivative files
        await execFileAsync('git', ['checkout', '--', '*'], opt);
        log.log('local changes are not committed...')
      }
    } catch(e) {
      log.error(e.message);
    }
  };

  /** */
  const postCopy = async () => {
    if (distrToFolder) {
      const pathEXE = path.join(rootGedeminDir, 'Gedemin', dstDir);
      return Promise.all(portableFilesList.map(
        fn => copyFileWithLog(path.join(pathEXE, fn), path.join(ciDir, distrToFolder, fn))
      ) );
    }
  };

  /** Очистка папки DCU */
  const clearDCU = async () => {
    let cnt = 0;
    for (const f of (await readdir(pathDCU))) {
      if (path.extname(f).toLowerCase() === '.dcu') {
        unlink(path.join(pathDCU, f));
        cnt++;
      }
    }
    if (!cnt) {
      log.log('Nothing to delete!');
    } else {
      log.log(`${cnt} files have been deleted...`);
    }
  };

  const adjustDest = (dest?: string) => dest ? dest.replace('EXE/', dstDir + '/') : dstDir;

  /**
   * Подготавливаем CFG файл для компиляции.
   * Текущий файл сохраним с именем .current.cfg и восстановим в конце процесса.
   * Файл создадим из шаблона, подставив нужные значения в зависимости от типа компиляции.
   */
  const prepareConfigFile = (project: ProjectID, pathProject: string) => async () => {
    const { dest, loc } = projects[project];

    /** Файл конфигурации проекта для компиляции */
    const cfgFileName = path.join(pathProject, `${project}.cfg`);
    /** Файл для сохранения текущей конфигурации */
    const savedCfgFileName = path.join(pathProject, `${project}.current.cfg`);

    if (existsSync(cfgFileName)) {
      await copyFile(cfgFileName, savedCfgFileName);
      log.log(`existing ${project}.cfg file saved as ${savedCfgFileName}...`);
    }

    // мы используем один список папок с исходниками для компиляции всех проектов
    const srcPath = gedeminSrcPath.join(';').replace(/<<DELPHI>>/gi, pathDelphi.replace(/\\/gi, '/'));

    let cfgBody = gedeminCfgTemplate.replace(/<<GEDEMIN_SRC_PATH>>/gi, srcPath);
    cfgBody = cfgBody.replace('<<GEDEMIN_PROJECT_DEST>>', adjustDest(dest));

    if (project === 'gedemin') {
      const { d_switch, o_switch, cond } = cfgVariables;

      cfgBody = cfgBody.replace('<<D_SWITCH>>', d_switch);
      cfgBody = cfgBody.replace('<<O_SWITCH>>', o_switch);
      cfgBody = cfgBody.replace('<<COND>>', cond);
    } else {
      cfgBody = cfgBody.replace('<<D_SWITCH>>', '-');
      cfgBody = cfgBody.replace('<<O_SWITCH>>', '+');
      cfgBody = cfgBody.replace('<<COND>>', 'DELPHI7');
    };

    if (loc && loc.indexOf('/') > -1) {
      cfgBody = cfgBody.replace(/\.\.\//gi,'../../');
    }

    const cfg = cfgBody.trim();
    await writeFile(cfgFileName, cfg);

    log.log(`Configuration file has been prepared and saved as ${cfgFileName}...`);
    //log.log(cfg);
  };

  /** Компиляция проекта по заданному типу */
  const buildProject = (project: ProjectID, pathProject: string) => async () => {
    const { dest, ext } = projects[project];

    /** Целевая папка компиляции */
    const destDir = path.join(rootGedeminDir, 'Gedemin', adjustDest(dest));

    /** Имя компилируемого файла */
    const destFileName = project + (ext ?? '.exe');
    const destFullFileName = path.join(destDir, destFileName);

    await deleteFile(destFullFileName);

    log.log(`building ${destFileName}: dcc32 ${dccSwitches.join(' ')} ${project}.dpr...`);
    const outputStreams = (await execFileAsync(
      path.join(pathDelphi, 'Bin', 'dcc32.exe'),
      [...dccSwitches, `${project}.dpr`],
      { ...basicExecOptions, cwd: pathProject }
    ));
    const output = outputStreams.stdout.trimEnd().split('\n');
    if (output.length) {
      log.log(output[0]);
      log.log(output[output.length - 1]);
    }

    const outputError = outputStreams.stderr.trimEnd();
    if (outputError) {
      log.error(outputError);
    }

    const destFileSize = (await stat(destFullFileName)).size;
    log.log(`${destFullFileName} has been built. File size: ${destFileSize}...`);

    const exeOpt = { ...basicExecOptions, cwd: destDir };

    // утилиты, которые мы применяем ниже находятся в папке EXE (папка по-умолчанию)
    // не будем применять их для проектов, которые компилируются в другие папки
    if (!dest) {
      if (path.extname(destFileName) === '.exe' && (await stat(path.join(destDir, destFileName))).size > 1024 * 1024) {
        log.log((await execFileAsync('StripReloc.exe', ['/b', destFileName], exeOpt)).stdout);
        log.log('relocation section has been stripped from EXE file...');
      };

      if (project === 'gedemin' && useTDSPack) {
        log.log((await execFileAsync('tdspack.exe', ['-e -o -a', destFileName], exeOpt)).stdout);
        log.log('debug information has been optimized...');
      };

      if (path.extname(destFileName) === '.exe') {
        log.log((await execFileAsync(path.join(binEditbin, 'editbin.exe'), ['/SWAPRUN:NET', destFileName], exeOpt)).stdout);
        log.log(`swaprun flag has been set on ${destFileName} file...`);
      };
    }

    log.log(`${destFileName} has been successfully built...`);
  };

  const setGedeminEXESize = async () => {
    /** Целевая папка компиляции */
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', adjustDest(projects['gedemin'].dest));

    if (exeSize) {
      const exeFullFileName = path.join(pathEXE, 'gedemin.exe');
      const currentExeSize = (await stat(exeFullFileName)).size;

      if (exeSize < currentExeSize) {
        throw new Error(`gedemin.exe is larger then needed exe size!`);
      }

      if (exeSize > currentExeSize) {
        const buf = Buffer.allocUnsafe(exeSize - currentExeSize).fill(0x90);
        await appendFile(exeFullFileName, buf);
        log.log(`gedemin.exe size has been set to ${exeSize}...`);
      }
    } else {
      log.log(`gedemin.exe size is not specified. Nothing to set...`);
    }
  };

  /** Файл архива */
  const gedeminArchiveFileName = path.join(archiveDir, archiveName);
  const etalonArchiveFileName = path.join(archiveDir, etalonArchiveName ?? 'etalon.rar');
  const gudfArchiveFileName = path.join(archiveDir, gudfArchiveName ?? 'gudf.rar');

  /**
   *  Формирование/синхронизация архива по файлу списка gedemin.lst
   *    добавление файлов
   *    обновление файлов более новыми версиями по дате
   *    удаление файлов, которых нет в списке
   */
  const createArhive = async () => {
    /** Целевая папка компиляции */
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', adjustDest(projects['gedemin'].dest));
    const lstFileName = path.join(archiveDir, 'gedemin.lst');
    await deleteFile(gedeminArchiveFileName);
    await writeFile(lstFileName, portableFilesList.join('\n'), { encoding: 'utf-8' });
    try {
      await packFiles(gedeminArchiveFileName, '@' + lstFileName, pathEXE, `portable archive has been created ${gedeminArchiveFileName}...`);
      await packFiles(etalonArchiveFileName, etalonDBFileName, baseDir, `etalon db archive has been created ${etalonArchiveFileName}...`);
      await packFiles(gudfArchiveFileName, 'gudf.dll', path.join(rootGedeminDir, 'Gedemin', adjustDest(projects['gudf'].dest)), `gudf.dll archive has been created ${gudfArchiveFileName}...`);
    } finally {
      await unlink(lstFileName);
    }
  };

  /** Восстановление сохраненных файлов конфигурации */
  const cleanupConfigFile = (project: ProjectID, pathProject: string) => async () => {
    /** Файл конфигурации проекта для компиляции */
    const cfgFileName = path.join(pathProject, project + '.cfg');

    /** Файл для сохранения текущей конфигурации */
    const savedCfgFileName = path.join(pathProject, project + '.current.cfg');

    if (existsSync(savedCfgFileName)) {
      await copyFile(savedCfgFileName, cfgFileName);
      log.log(`previous ${project}.cfg file has been restored...`);
      await unlink(savedCfgFileName);
    };
  };

  //TODO: сейчас инкрементируется билд только для gedemin.exe
  //но для остальных утилит тоже надо сделать инкремент

  /** Инкремент версии */
  const incVer = (project: ProjectID, pathProject: string) => async () => {
    /** RC-файл версии  */
    const verRCFileName = path.join(pathProject, `${project}_ver.rc`);
    /** RES-файл версии  */
    const verResFileName = path.join(pathProject, `${project}_ver.res`);
    /** Путь рисунков */
    const pathImages = path.resolve(pathProject, '..\\images');

    if (project === 'gedemin' && customRcFile) {
      if (!existsSync(path.join(pathProject, customRcFile))) {
        throw new Error(`rc file ${customRcFile} not found!`);
      }

      log.log(
        (await execFileAsync(
          path.join(pathDelphi, 'Bin', 'brcc32.exe'),
          [`-fo${project}_ver.res`, `-i${pathImages}`, `${customRcFile}`],
          { ...basicExecOptions, cwd: pathProject }
        )).stdout
      );
      log.log(`custom res file ${customRcFile} has been successfully built...`);
    } else {

      const { rc } = projects[project];

      if (!rc) {
        log.log(`project ${project} doesn't have a version resource...`);
        log.log(`skip incrementation...`);
        return;
      };

      if (!existsSync(verRCFileName)) {
        throw new Error(`rc file ${verRCFileName} not found!`);
      }

      if (commitBuildNumber) {
        const rcText = (await readFile(verRCFileName)).toString().trim().split('\n');
        const fvIndex = rcText.findIndex( s => s.startsWith('FILEVERSION') );

        if (fvIndex === -1) {
          throw new Error(`Invalid ${verRCFileName} file format.`);
        }

        // extract current build number from second string of .rc file: FILEVERSION 2, 9, 5, 11591
        const buildNumber = parseInt(rcText[fvIndex].split(',')[3].trim()) + 1;

        let newRC = rc;
        newRC = newRC.replace(/<<BUILD_NUMBER>>/gi, buildNumber.toString());
        newRC = newRC.replace('<<YEAR>>', new Date().getFullYear().toString());

        await writeFile(verRCFileName, newRC);

        log.log(`build number for ${project} has been incremented to ${buildNumber}...`);
        log.log(`${project}_ver.rc saved...`);

        if (project === 'gedemin') {
          log.log(`newest gedemin.exe version ${buildNumber}...`, { bot: true });
        }
      } else {
        log.log(`version incrementation for ${verRCFileName} is skipped...`);
      }

      await deleteFile(verResFileName);

      log.log(
        (await execFileAsync(
          path.join(pathDelphi, 'Bin', 'brcc32.exe'),
          [`-fo${project}_ver.res`, `-i${pathImages}`, `${project}_ver.rc`],
          { ...basicExecOptions, cwd: pathProject }
        )).stdout
      );
      log.log(`${project}_ver.res has been successfully built...`);
    }
  };

  const uploadArhive = async () => {
    if (upload) {
      await uploadFile(gedeminArchiveFileName, 'https://gsbelarus.com/gs/content/upload2.php');
      await uploadFile(gudfArchiveFileName, 'https://gsbelarus.com/gs/content/upload2.php');
      await uploadFile(etalonArchiveFileName, 'https://gsbelarus.com/gs/content/upload2.php');
      //await Promise.all(
      //  [gedeminArchiveFileName, gudfArchiveFileName, etalonArchiveFileName].map( arc => uploadFile(arc, 'https://gsbelarus.com/gs/content/upload2.php') )
      //);
    } else {
      log.log('skip uploading...');
    }
  };

  /** Создание эталонной БД */
  const createEtalonDB = async () => {
    const dbFileName = 'etalon.fdb';
    const dbFullFileName = path.join(baseDir, dbFileName);

    await deleteFile(dbFullFileName);

    const connectionString = getFBConnString(fbConnect, dbFullFileName);
    const sqlScriptHeader = Buffer.from(gedeminSQL.header
      .replace('<<FB_CONNECT>>', connectionString)
      .replace('<<USER_NAME>>', fbUser ?? 'SYSDBA')
      .replace('<<USER_PASS>>', fbPassword ?? 'masterkey'));
    const sqlScriptBody = Buffer.concat(await Promise.all(gedeminSQL.firstPass.map( fn => readFile(path.join(pathSQL, fn), { encoding: undefined }) ) ) );

    const sqlScriptFN = path.join(pathSQL, 'result.sql');
    await writeFile(sqlScriptFN, Buffer.concat([sqlScriptHeader, sqlScriptBody]));
    log.log(`${sqlScriptFN} has been saved...`);

    const opt = { ...basicExecOptions, cwd: pathSQL };

    log.log(`first pass...`);
    await execFileAsync(path.join(binFirebird, 'isql.exe'), ['-q', '-i', sqlScriptFN], opt);
    if (!existsSync(dbFullFileName)) {
      throw new Error('Can not create database!');
    };

    const sqlScriptFN2 = path.join(pathSQL, 'result2.sql');
    log.log(`execute makelbrbtree...`);
    await execFileAsync(path.join(pathSQL, 'makelbrbtree.exe'), [ '/sn', connectionString, '/fo', sqlScriptFN2 ], opt);
    log.log(`${sqlScriptFN2} has been saved...`);

    const sqlScriptBody2 = Buffer.concat(await Promise.all(['result2.sql', ...gedeminSQL.secondPass].map( fn => readFile(path.join(pathSQL, fn), { encoding: undefined }) ) ) );
    await writeFile(sqlScriptFN, Buffer.concat([sqlScriptHeader, sqlScriptBody, sqlScriptBody2]));
    log.log(`${sqlScriptFN} has been saved...`);

    await deleteFile(dbFullFileName);

    log.log(`second pass...`);
    await execFileAsync(path.join(binFirebird, 'isql.exe'), [ '-q', '-i', sqlScriptFN], opt);
    if (existsSync(dbFullFileName)) {
      log.log(`${dbFileName} has been created...`);
    };

    const sqlScriptHeaderEtalon = Buffer.from(gedeminSQL.header
      .replace('<<FB_CONNECT>>', 'put_your_database_name')
      .replace('<<USER_NAME>>', 'SYSDBA')
      .replace('<<USER_PASS>>', 'SYSDBA_password'));
    const sqlScriptEtalon = path.join(pathSQL, 'etalon.sql');
    if (existsSync(sqlScriptEtalon)) {
      log.log(`previous ${sqlScriptEtalon} has been deleted...`);
    };
    await writeFile(sqlScriptEtalon, Buffer.concat([sqlScriptHeaderEtalon, sqlScriptBody, sqlScriptBody2]));
    log.log(`${sqlScriptEtalon} has been saved...`);

    Promise.all([sqlScriptFN, sqlScriptFN2].map( fn => deleteFile(fn) ));
  };

  /** Список проектов для компиляции */
  type ProjectID = 'gedemin' | 'gdcc' | 'gedemin_upd' | 'gudf' | 'makelbrbtree';
  const ugProjectList: ProjectID[] = ['gedemin', 'gdcc', 'gedemin_upd', 'gudf', 'makelbrbtree'];

  await runProcesses(`Gedemin compilation: ${label}`, [
    { name: 'Check prerequisites', fn: checkPrerequisites },
    { name: 'Pull latest sources', fn: pullSources },
    { name: 'Clear DCU folder', fn: clearDCU },
    ...ugProjectList.flatMap( pr => {
      const { loc } = projects[pr];

      /** Основная папка проекта, где находятся .dpr, .cfg, .rc файлы */
      const pathProject = path.join(rootGedeminDir, 'Gedemin', loc ?? 'Gedemin');

      return [
        { name: `Increment version for ${pr}`, fn: incVer(pr, pathProject) },
        { name: `Prepare config files for ${pr}`, fn: prepareConfigFile(pr, pathProject) },
        { name: `Build ${pr}`, fn: buildProject(pr, pathProject) },
        { name: `Clean up after building ${pr}`, fn: cleanupConfigFile(pr, pathProject) }
      ]
    }),
    { name: 'Post copy', fn: postCopy },
    { name: 'Set gedemin.exe size', fn: setGedeminEXESize },
    { name: 'Create etalon database', fn: createEtalonDB },
    { name: 'Create portable version archive', fn: createArhive },
    { name: 'Upload archive', fn: uploadArhive },
    { name: 'Inc build number', fn: pushIncBuildNumber },
  ]);
};
