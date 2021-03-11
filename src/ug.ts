//FIXME: было бы неплохо дать краткое описание процесса компиляции. чтомы берем, откуда, для чего, что и куда помещаем

/**
 * Текущий функционал
 *    Снятие из гита последних исходников
 *    Компиляция нового экзешника заданного типа
 *    Формирование архива по файлу списка
 */

import { execFileSync, ExecFileSyncOptions } from 'child_process';
import {
  existsSync, readFileSync, readdirSync, unlinkSync, copyFileSync, writeFileSync,
  statSync, appendFileSync, createReadStream
} from 'fs';
import path from 'path';
import { Log } from './log';
import {
  gedeminCfgTemplate, gedeminCfgVariables, gedeminSrcPath, gedeminCompilerSwitch,
  gedeminArchiveName, portableFilesList, projectParams, gedeminSQL
} from './const';
import FormData from 'form-data';

export interface IParams {
  /**
   * Тип компиляции:
   *    выбор файла конфигурации, ключей компиляции, файла архива
   */
  compilationType: 'PRODUCT' | 'DEBUG' | 'LOCK';
  /** Установить заданный размер исполнимого файла */
  setExeSize?: number;
  /**
   * Корневая папка с полными исходниками Гедымина.
   * В ней находятся папки Comp5 и Gedemin.
   */
  rootGedeminDir: string;

  /** Папка архива */
  archiveDir: string;
  /** Папка Delphi */
  pathDelphi: string;
  /** Папка утилиты Editbin */
  binEditbin: string;
  /** Папка WinRAR */
  binWinRAR: string;
  /** Папка Firebird */
  binFirebird: string;
  /** Upload files to web site */
  upload?: boolean;
  /** */
  logFile?: string;
  /** */
  maxLogSize?: number;
};

/**
 * Главная функция.
 * @param log Логгер.
 */
export async function ug(params: IParams, log: Log) {

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
    }
  }

  const { compilationType, setExeSize, rootGedeminDir, archiveDir, pathDelphi, binEditbin, binWinRAR, upload } = params;

  /** В процессе компиляции DCU файлы помещаются в эту папку */
  const pathDCU = path.join(rootGedeminDir, 'Gedemin', 'DCU');
  /** Папка SQL-файлов для создания эталонной БД */
  const pathSQL = path.join(rootGedeminDir, 'Gedemin', 'SQL');

  /**
   * Снимаем исходники с гита.
   * как он понимает репозиторий?
   * где логин пароль?
   *
   * если он берет уже из настроенного гита,
   * то надо отразить в инструкции по развертыванию,
   * что гит должен быть настроен, логин пароль введен и т.п.
   */

  /**
   * Параметры execFileSync
   *    Компиляция работает c maxBuffer 2M примерно 30 сек (i5 8G SSD),
   *    на всякий случай maxBuffer и timeout ставим больше;
   *    гит и прочие программы вписываются в параметры для компиляции,
   *    т.е. для выполнения execFileSync к параметрам basicExecOptions добавляем только cwd
   */
  const basicExecOptions: ExecFileSyncOptions = {
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 64,
    timeout: 5 * 60 * 1000
  };

  /** Проверяем наличие необходимых файлов, программ, папок */
  const checkPrerequisites = () => {
    if (!existsSync(archiveDir)) {
      throw new Error(`Archive dir "${archiveDir}" not found!`);
    }

    log.log('everything is ok!');
  };

  /** Снятие из гита последних исходников */
  const pullSources = () => {
    const opt = { ...basicExecOptions, cwd: rootGedeminDir };
    log.log('git checkout master...');
    log.log(execFileSync('git', ['checkout', 'master'], opt).toString());
    log.log('git pull origin master...');
    log.log(execFileSync('git', ['pull', 'origin', 'master'], opt).toString());
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
  const prepareConfigFile = (project: Project, pathProject: string) => {
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
    cfgBody = cfgBody.replace('<<GEDEMIN_PROJECT_DEST>>', projectParams[project].dest ?? 'EXE');

    if (project === 'gedemin') {
      const { d_switch, o_switch, cond } = gedeminCfgVariables[compilationType];

      cfgBody = cfgBody.replace('<<D_SWITCH>>', d_switch);
      cfgBody = cfgBody.replace('<<O_SWITCH>>', o_switch);
      cfgBody = cfgBody.replace('<<COND>>', cond);
    } else {
      cfgBody = cfgBody.replace('<<D_SWITCH>>', '-');
      cfgBody = cfgBody.replace('<<O_SWITCH>>', '+');
      cfgBody = cfgBody.replace('<<COND>>', '');
    }

    writeFileSync(cfgFileName, cfgBody.trim());

    log.log(`Configuration file has been prepared and saved as ${cfgFileName}...`);
  };

  /** Компиляция проекта по заданному типу */
  const buildProject = (project: Project, pathProject: string) => {
    /** Целевая папка компиляции */
    const destDir = path.join(rootGedeminDir, 'Gedemin', projectParams[project].dest ?? 'EXE');

    /** Имя компилируемого файла */
    const destFileName = project + (projectParams[project].ext ?? '.exe');
    const destFullFileName = path.join(destDir, destFileName);

    if (existsSync(destFullFileName)) {
      unlinkSync(destFullFileName);
      log.log(`previous ${destFileName} has been deleted...`);
    }

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

    log.log(`${destFileName} has been successfully built...`);
  };

  const setGedeminEXESize = () => {
    const project: Project = 'gedemin';
    /** Целевая папка компиляции */
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', projectParams[project].dest ?? 'EXE');

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

  /**
   *  Формирование/синхронизация архива по файлу списка gedemin.lst
   *    добавление файлов
   *    обновление файлов более новыми версиями по дате
   *    удаление файлов, которых нет в списке
   */
  const createArhive = () => {
    const project: Project = 'gedemin';
    /** Целевая папка компиляции */
    const pathEXE = path.join(rootGedeminDir, 'Gedemin', projectParams[project].dest ?? 'EXE');

    if (existsSync(gedeminArchiveFileName)) {
      unlinkSync(gedeminArchiveFileName);
    }

    const lstFileName = path.join(archiveDir, 'gedemin.lst');

    writeFileSync(lstFileName, portableFilesList.join('\n'), { encoding: 'utf-8' });

    log.log(
      execFileSync(path.join(binWinRAR, 'WinRAR.exe'),
        [ 'a', '-u', '-as', '-ibck',
          gedeminArchiveFileName,
          '@' + lstFileName ],
        { ...basicExecOptions, cwd: pathEXE }).toString()
    );

    unlinkSync(lstFileName);

    if (existsSync(gedeminArchiveFileName)) {
      log.log(`portable archive has been created ${gedeminArchiveFileName}...`);
    } else {
      throw new Error('Can not create portable archive!');
    };
  };

  /** Восстановление сохраненных файлов конфигурации */
  const cleanupConfigFile = (project: Project, pathProject: string) => {
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
  const incVer = (project: Project, pathProject: string) => {
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

    let newRC = projectParams[project].rc;
    newRC = newRC.replace(/<<BUILD_NUMBER>>/gi, buildNumber.toString());
    newRC = newRC.replace('<<YEAR>>', new Date().getFullYear().toString());

    writeFileSync(verRCFileName, newRC);

    log.log(`build number for ${project} has been incremented to ${buildNumber}...`);
    log.log(`${project}_ver.rc saved...`);

    if (existsSync(verResFileName)) {
      unlinkSync(verResFileName);
      log.log(`previous ${project}_ver.res has been deleted...`);
    }

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
      const form = new FormData();

      form.append('data', createReadStream(gedeminArchiveFileName), {
        filename: path.basename(gedeminArchiveFileName),
        filepath: gedeminArchiveFileName,
        contentType: 'application/zip',
        knownLength: statSync(gedeminArchiveFileName).size
      });

      log.log(`uploading ${path.basename(gedeminArchiveFileName)}...`)

      // исходники PHP скриптов приведены в папке PHP
      await form.submit('http://gsbelarus.com/gs/content/upload2.php');

      log.log(`archive ${path.basename(gedeminArchiveFileName)} has been uploaded...`)
    } else {
      log.log('skip uploading...');
    }
  };

  /** Создание эталонной БД */
  const createEtalonDB = async () => {
    let stage = 1;
    let sqlText = readFileSync(path.join(pathSQL, gedeminSQL[stage][0])).toString();

    for (let i = 1; i < gedeminSQL[stage].length; i++) {
      sqlText += readFileSync(path.join(pathSQL, gedeminSQL[stage][i])).toString();
    };

  };

  /** Список проектов для компиляции */
  const ugProjectList = ['gedemin', 'gdcc', 'gedemin_upd', 'gudf'] as const;
  type Project = typeof ugProjectList[0] | typeof ugProjectList[1] | typeof ugProjectList[2] | typeof ugProjectList[3];

  /** Количество шагов процесса */
  const steps = 6 + ugProjectList.length * 4;

  /** Начало процесса */
  log.startProcess('Gedemin compilation', steps);

  log.log(`Read params: ${JSON.stringify(params, undefined, 2)}`);
  log.log(`Compilation type: ${compilationType}`);
  log.log(`Gedemin root dir: ${rootGedeminDir}`);

  await runProcess('Check prerequisites', checkPrerequisites);
  await runProcess('Pull latest sources', pullSources);
  await runProcess('Clear DCU folder', clearDCU);

  for (const pr of ugProjectList) {
    /** Основная папка проекта, где находятся .dpr, .cfg, .rc файлы */
    const pathProject = path.join(rootGedeminDir, 'Gedemin', projectParams[pr].loc ?? 'Gedemin');

    await runProcess(`Increment version for ${pr}`,  () => incVer(pr, pathProject));
    await runProcess(`Prepare config files for ${pr}`, () => prepareConfigFile(pr, pathProject));
    await runProcess(`Build ${pr}`, () => buildProject(pr, pathProject));
    await runProcess(`Clean up after building ${pr}`, () => cleanupConfigFile(pr, pathProject));
  };

  await runProcess('Set gedemin.exe size', setGedeminEXESize);
  await runProcess('Create portable version archive', createArhive);
  await runProcess('Upload archive', uploadArhive);

  await runProcess('Create etalon database', createEtalonDB);

  /** Окончание процесса */
  log.finishProcess();
};