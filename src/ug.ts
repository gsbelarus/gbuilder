//FIXME: было бы неплохо дать краткое описание процесса компиляции. чтомы берем, откуда, для чего, что и куда помещаем

/**
 * Текущий функционал
 *    Снятие из гита последних исходников
 *    Компиляция нового экзешника заданного типа
 *    Формирование архива по файлу списка
 */

import { execFileSync } from 'child_process';
import {
  existsSync, readFileSync, readdirSync, unlinkSync, copyFileSync, writeFileSync,
  statSync, appendFileSync } from 'fs';
import path from 'path';
import { Log } from './log';
import {
  gedeminCfgTemplate, gedeminCfgVariables, gedeminSrcPath, gedeminCompilerSwitch,
  gedeminArchiveName, portableFilesList, projects, gedeminSQL, etalonDBFileName, getFBConnString
} from './const';
import { IParams } from './types';
import { basicExecOptions, bindLog } from './utils';

/**
 * Главная функция.
 * @param log Логгер.
 */
export async function ug(params: IParams, log: Log) {

  const { runProcesses, packFiles, deleteFile, assureDir, uploadFile } = bindLog(params, log);
  const { compilationType, setExeSize, rootGedeminDir, archiveDir, pathDelphi, binEditbin, binFirebird,
    upload, srcBranch, commitIncBuildNumber, fbConnect, fbUser, fbPassword } = params;

  /** В процессе компиляции DCU файлы помещаются в эту папку */
  const pathDCU = path.join(rootGedeminDir, 'Gedemin', 'DCU');
  /** Папка SQL-файлов для создания эталонной БД */
  const pathSQL = path.join(rootGedeminDir, 'Gedemin', 'SQL');
  /** */
  const baseDir = path.join(rootGedeminDir, 'Gedemin', 'EXE', 'Database');

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

    log.log('everything is ok!');
  };

  /** Снятие из гита последних исходников */
  const pullSources = () => {
    const opt = { ...basicExecOptions, cwd: rootGedeminDir };
    log.log(`git checkout ${srcBranch}...`);
    log.log(execFileSync('git', ['checkout', srcBranch], opt).toString());
    log.log(`git pull...`);
    log.log(execFileSync('git', ['pull'], opt).toString());
  };

  /** */
  const pushIncBuildNumber = () => {
    if (commitIncBuildNumber) {
      const opt = { ...basicExecOptions, cwd: rootGedeminDir };
      log.log(`git commit -a -m "Inc build number"...`);
      log.log(execFileSync('git', ['commit', '-a', '-m', 'Inc build number'], opt).toString());
      log.log(`git push...`);
      log.log(execFileSync('git', ['push'], opt).toString());
    } else {
      log.log('local changes are not committed...')
    }
  };

  /** Очистка папки DCU */
  const clearDCU = () => {
    let cnt = 0;
    for (const f of readdirSync(pathDCU)) {
      if (path.extname(f).toLowerCase() === '.dcu') {
        unlinkSync(path.join(pathDCU, f));
        cnt++;
      }
    }
    if (!cnt) {
      log.log('Nothing to delete!');
    } else {
      log.log(`${cnt} files have been deleted...`);
    }
  };

  /**
   * Подготавливаем CFG файл для компиляции.
   * Текущий файл сохраним с именем .current.cfg и восстановим в конце процесса.
   * Файл создадим из шаблона, подставив нужные значения в зависимости от типа компиляции.
   */
  const prepareConfigFile = (project: ProjectID, pathProject: string) => () => {
    const { dest, loc } = projects[project];

    /** Файл конфигурации проекта для компиляции */
    const cfgFileName = path.join(pathProject, `${project}.cfg`);
    /** Файл для сохранения текущей конфигурации */
    const savedCfgFileName = path.join(pathProject, `${project}.current.cfg`);

    if (existsSync(cfgFileName)) {
      copyFileSync(cfgFileName, savedCfgFileName);
      log.log(`existing ${project}.cfg file saved as ${savedCfgFileName}...`);
    }

    // мы используем один список папок с исходниками для компиляции всех проектов
    const srcPath = gedeminSrcPath.join(';').replace(/<<DELPHI>>/gi, pathDelphi.replace(/\\/gi, '/'));

    let cfgBody = gedeminCfgTemplate.replace(/<<GEDEMIN_SRC_PATH>>/gi, srcPath);
    cfgBody = cfgBody.replace('<<GEDEMIN_PROJECT_DEST>>', dest ?? 'EXE');

    if (project === 'gedemin') {
      const { d_switch, o_switch, cond } = gedeminCfgVariables[compilationType];

      cfgBody = cfgBody.replace('<<D_SWITCH>>', d_switch);
      cfgBody = cfgBody.replace('<<O_SWITCH>>', o_switch);
      cfgBody = cfgBody.replace('<<COND>>', cond);
    } else {
      cfgBody = cfgBody.replace('<<D_SWITCH>>', '-');
      cfgBody = cfgBody.replace('<<O_SWITCH>>', '+');
      cfgBody = cfgBody.replace('<<COND>>', '');
    };

    if (loc && loc.indexOf('/') > -1) {
      cfgBody = cfgBody.replace(/\.\.\//gi,'../../');
    }

    writeFileSync(cfgFileName, cfgBody.trim());

    log.log(`Configuration file has been prepared and saved as ${cfgFileName}...`);
  };

  /** Компиляция проекта по заданному типу */
  const buildProject = (project: ProjectID, pathProject: string) => () => {
    const { dest, ext } = projects[project];

    /** Целевая папка компиляции */
    const destDir = path.join(rootGedeminDir, 'Gedemin', dest ?? 'EXE');

    /** Имя компилируемого файла */
    const destFileName = project + (ext ?? '.exe');
    const destFullFileName = path.join(destDir, destFileName);

    deleteFile(destFullFileName);

    log.log(`building ${destFileName}...`);
    log.log(
      execFileSync(
        path.join(pathDelphi, 'Bin', 'dcc32.exe'),
        [gedeminCompilerSwitch[compilationType], `${project}.dpr`],
        { ...basicExecOptions, cwd: pathProject }
      ).toString()
    );
    log.log(`${destFileName} has been built...`);

    const exeOpt = { ...basicExecOptions, cwd: destDir };

    // утилиты, которые мы применяем ниже находятся в папке EXE (папка по-умолчанию)
    // не будем применять их для проектов, которые компилируются в другие папки
    if (!dest) {
      if (path.extname(destFileName) === '.exe') {
        log.log(execFileSync('StripReloc.exe', ['/b', destFileName], exeOpt).toString());
        log.log('relocation section has been stripped from EXE file...');
      };

      if (project === 'gedemin' && compilationType === 'DEBUG') {
        log.log(execFileSync('tdspack.exe', ['-e -o -a', destFileName], exeOpt).toString());
        log.log('debug information has been optimized...');
      };

      if (path.extname(destFileName) === '.exe') {
        log.log(execFileSync(path.join(binEditbin, 'editbin.exe'), ['/SWAPRUN:NET', destFileName], exeOpt).toString());
        log.log(`swaprun flag has been set on ${destFileName} file...`);
      };
    }

    log.log(`${destFileName} has been successfully built...`);
  };

  const setGedeminEXESize = () => {
    /** Целевая папка компиляции */
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', projects['gedemin'].dest ?? 'EXE');

    if (setExeSize) {
      const exeFullFileName = path.join(pathEXE, 'gedemin.exe');
      const currentExeSize = statSync(exeFullFileName).size;

      if (setExeSize < currentExeSize) {
        throw new Error(`gedemin.exe is larger then needed exe size!`);
      }

      if (setExeSize > currentExeSize) {
        const buf = Buffer.allocUnsafe(setExeSize - currentExeSize).fill(0x90);
        appendFileSync(exeFullFileName, buf);
        log.log(`gedemin.exe size has been set to ${setExeSize}...`);
      }
    } else {
      log.log(`gedemin.exe size is not specified. Nothing to set...`);
    }
  };

  /** Файл архива */
  const gedeminArchiveFileName = path.join(archiveDir, gedeminArchiveName[compilationType]);
  const etalonArchiveFileName = path.join(archiveDir, 'etalon.rar');
  const gudfArchiveFileName = path.join(archiveDir, 'gudf.rar');

  /**
   *  Формирование/синхронизация архива по файлу списка gedemin.lst
   *    добавление файлов
   *    обновление файлов более новыми версиями по дате
   *    удаление файлов, которых нет в списке
   */
  const createArhive = () => {
    /** Целевая папка компиляции */
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', projects['gedemin'].dest ?? 'EXE');
    const lstFileName = path.join(archiveDir, 'gedemin.lst');
    deleteFile(gedeminArchiveFileName);
    writeFileSync(lstFileName, portableFilesList.join('\n'), { encoding: 'utf-8' });
    try {
      packFiles(gedeminArchiveFileName, '@' + lstFileName, pathEXE, `portable archive has been created ${gedeminArchiveFileName}...`);
      packFiles(etalonArchiveFileName, etalonDBFileName, baseDir, `etalon db archive has been created ${etalonArchiveFileName}...`);
      packFiles(gudfArchiveFileName, 'gudf.dll', path.join(rootGedeminDir, 'Gedemin', projects['gudf'].dest ?? 'EXE'), `gudf.dll archive has been created ${gudfArchiveFileName}...`);
    } finally {
      unlinkSync(lstFileName);
    }
  };

  /** Восстановление сохраненных файлов конфигурации */
  const cleanupConfigFile = (project: ProjectID, pathProject: string) => () => {
    /** Файл конфигурации проекта для компиляции */
    const cfgFileName = path.join(pathProject, project + '.cfg');

    /** Файл для сохранения текущей конфигурации */
    const savedCfgFileName = path.join(pathProject, project + '.current.cfg');

    if (existsSync(savedCfgFileName)) {
      copyFileSync(savedCfgFileName, cfgFileName);
      log.log(`previous ${project}.cfg file has been restored...`);
      unlinkSync(savedCfgFileName);
    };
  };

  //TODO: сейчас инкрементируется билд только для gedemin.exe
  //но для остальных утилит тоже надо сделать инкремент

  /** Инкремент версии */
  const incVer = (project: ProjectID, pathProject: string) => () => {
    const { rc } = projects[project];

    if (!rc) {
      log.log(`project ${project} doesn't have a version resource...`);
      log.log(`skip incrementation...`);
      return;
    };

    /** RC-файл версии  */
    const verRCFileName = path.join(pathProject, `${project}_ver.rc`);
    /** RES-файл версии  */
    const verResFileName = path.join(pathProject, `${project}_ver.res`);
    /** Путь рисунков */
    const pathImages = path.resolve(pathProject, '..\\images');

    const rcText = readFileSync(verRCFileName).toString().trim().split('\n');
    const fvIndex = rcText.findIndex( s => s.startsWith('FILEVERSION') );

    if (fvIndex === -1) {
      throw new Error(`Invalid ${verRCFileName} file format.`);
    }

    // extract current build number from second string of .rc file: FILEVERSION 2, 9, 5, 11591
    const buildNumber = parseInt(rcText[fvIndex].split(',')[3].trim()) + 1;

    let newRC = rc;
    newRC = newRC.replace(/<<BUILD_NUMBER>>/gi, buildNumber.toString());
    newRC = newRC.replace('<<YEAR>>', new Date().getFullYear().toString());

    writeFileSync(verRCFileName, newRC);

    log.log(`build number for ${project} has been incremented to ${buildNumber}...`);
    log.log(`${project}_ver.rc saved...`);

    deleteFile(verResFileName);

    log.log(
      execFileSync(
        path.join(pathDelphi, 'Bin', 'brcc32.exe'),
        [`-fo${project}_ver.res`, `-i${pathImages}`, `${project}_ver.rc`],
        { ...basicExecOptions, cwd: pathProject }
      ).toString()
    );
    log.log(`${project}_ver.res has been successfully built...`);
  };

  const uploadArhive = async () => {
    if (upload) {
      await Promise.all(
        [gedeminArchiveFileName, gudfArchiveFileName, etalonArchiveFileName].map( arc => uploadFile(arc, 'http://gsbelarus.com/gs/content/upload2.php') )
      );
    } else {
      log.log('skip uploading...');
    }
  };

  /** Создание эталонной БД */
  const createEtalonDB = async () => {
    const dbFileName = 'etalon.fdb';
    const dbFullFileName = path.join(baseDir, dbFileName);

    deleteFile(dbFullFileName);

    const connectionString = getFBConnString(fbConnect, dbFullFileName);
    const sqlScriptHeader = Buffer.from(gedeminSQL.header
      .replace('<<FB_CONNECT>>', connectionString)
      .replace('<<USER_NAME>>', fbUser ?? 'SYSDBA')
      .replace('<<USER_PASS>>', fbPassword ?? 'masterkey'));
    const sqlScriptBody = Buffer.concat(gedeminSQL.firstPass.map( fn => readFileSync(path.join(pathSQL, fn), { encoding: undefined }) ) );

    const sqlScriptFN = path.join(pathSQL, 'result.sql');
    writeFileSync(sqlScriptFN, Buffer.concat([sqlScriptHeader, sqlScriptBody]));
    log.log(`${sqlScriptFN} has been saved...`);

    const opt = { ...basicExecOptions, cwd: pathSQL };

    log.log(`first pass...`);
    execFileSync(path.join(binFirebird, 'isql.exe'), ['-q', '-i', sqlScriptFN], opt);
    if (!existsSync(dbFullFileName)) {
      throw new Error('Can not create database!');
    };

    const sqlScriptFN2 = path.join(pathSQL, 'result2.sql');
    log.log(`execute makelbrbtree...`);
    execFileSync(path.join(pathSQL, 'makelbrbtree.exe'), [ '/sn', connectionString, '/fo', sqlScriptFN2 ], opt);
    log.log(`${sqlScriptFN2} has been saved...`);

    const sqlScriptBody2 = Buffer.concat(['result2.sql', ...gedeminSQL.secondPass].map( fn => readFileSync(path.join(pathSQL, fn), { encoding: undefined }) ) );
    writeFileSync(sqlScriptFN, Buffer.concat([sqlScriptHeader, sqlScriptBody, sqlScriptBody2]));
    log.log(`${sqlScriptFN} has been saved...`);

    deleteFile(dbFullFileName);

    log.log(`second pass...`);
    execFileSync(path.join(binFirebird, 'isql.exe'), [ '-q', '-i', sqlScriptFN], opt);
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
    writeFileSync(sqlScriptEtalon, Buffer.concat([sqlScriptHeaderEtalon, sqlScriptBody, sqlScriptBody2]));
    log.log(`${sqlScriptEtalon} has been saved...`);

    [sqlScriptFN, sqlScriptFN2].forEach( fn => deleteFile(fn) );
  };

  /** Список проектов для компиляции */
  type ProjectID = 'gedemin' | 'gdcc' | 'gedemin_upd' | 'gudf' | 'makelbrbtree';
  const ugProjectList: ProjectID[] = ['gedemin', 'gdcc', 'gedemin_upd', 'gudf', 'makelbrbtree'];

  log.log(`Compilation type: ${compilationType}`);
  log.log(`Gedemin root dir: ${rootGedeminDir}`);
  log.log(`Archive dir: ${archiveDir}`);
  log.log(`Database dir: ${baseDir}`);

  await runProcesses('Gedemin compilation', [
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
    { name: 'Set gedemin.exe size', fn: setGedeminEXESize },
    { name: 'Create etalon database', fn: createEtalonDB },
    { name: 'Create portable version archive', fn: createArhive },
    { name: 'Upload archive', fn: uploadArhive },
    { name: 'Inc build number', fn: pushIncBuildNumber }
  ]);
};
