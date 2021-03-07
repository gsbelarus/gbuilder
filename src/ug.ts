//FIXME: было бы неплохо дать краткое описание процесса компиляции. чтомы берем, откуда, для чего, что и куда помещаем

/**
 * Текущий функционал
 *    Снятие из гита последних исходников
 *    Компиляция нового экзешника заданного типа
 *    Формирование архива по файлу списка
 */

import { execFileSync, ExecFileSyncOptions } from 'child_process';
import { existsSync, readFileSync, readdirSync, unlinkSync, copyFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Log } from './log';
import {
   gedeminCfgTemplate as cfgFileTemplate, gedeminCfgVariables, gedeminSrcPath,
   gedeminCompilerSwitch, gedeminArchiveName, portableFilesList, gedeminVerRC} from './const';

export interface IParams {
  /**
   * Тип компиляции:
   *    выбор файла конфигурации, ключей компиляции, файла архива
   */
  compilationType: 'PRODUCT' | 'DEBUG' | 'LOCK';

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
};

/**
 * Главная функция.
 * @param log Логгер.
 */
export function ug(log: Log) {

  /** Обертка процесса
   *  @param name имя процесса
   *  @param fn функция
   *  @param skip пропустить выполнение
   */
  const runProcess = (name: string, fn: () => void, skip = false) => {
    if (skip) {
      log.log(`skipped ${name}...`);
    } else {
      log.startProcess(name);

      try {
        fn();
      } catch(e) {
        log.error(e.message);
        process.exit(1);
      };

      log.finishProcess();
    }
  }

  const paramsFile = process.argv[2];

  if (!paramsFile || !existsSync(paramsFile)) {
    console.error('Full name of the file with build process parameters must be specified as a first command line argument.');
    return;
  }

  const params = JSON.parse(readFileSync(paramsFile, {encoding:'utf8', flag:'r'})) as IParams;

  const { compilationType, rootGedeminDir, archiveDir, pathDelphi, binEditbin, binWinRAR } = params;

  /** Основная папка проекта, где находятся .dpr, .cfg, .rc файлы */
  const pathGedemin = path.join(rootGedeminDir, 'Gedemin', 'Gedemin')
  /** В процессе компиляции DCU файлы помещаются в эту папку */
  const pathDCU = path.join(rootGedeminDir, 'Gedemin', 'DCU');
  /** Целевая папка компиляции */
  const pathEXE = path.join(rootGedeminDir, 'Gedemin', 'EXE');

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
  const prepareConfigFile = (project: Project) => {
    /** Файл конфигурации проекта для компиляции */
    const cfgFileName = path.join(pathGedemin, `${project}.cfg`);
    /** Файл для сохранения текущей конфигурации */
    const savedCfgFileName = path.join(pathGedemin, `${project}.current.cfg`);

    if (existsSync(cfgFileName)) {
      copyFileSync(cfgFileName, savedCfgFileName);
      log.log(`existing ${project}.cfg file saved as ${savedCfgFileName}...`);
    }

    // мы используем один список папок с исходниками для компиляции всех проектов
    const srcPath = gedeminSrcPath.join(';').replace(/<<DELPHI>>/gi, pathDelphi.replace(/\\/gi, '/'));

    let cfgBody = cfgFileTemplate.replace(/<<GEDEMIN_SRC_PATH>>/gi, srcPath);

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

  /** Компиляция нового экзешника проекта по заданному типа */
  const buildProject = (project: Project) => {
    /** Имя компилируемого файла */
    const exeFileName = project + '.exe';
    const exeFullFileName = path.join(pathEXE, exeFileName);

    if (existsSync(exeFullFileName)) {
      unlinkSync(exeFullFileName);
      log.log(`previous ${exeFileName} has been deleted...`);
    }

    log.log(`building ${exeFileName}...`);
    log.log(
      execFileSync(
        path.join(pathDelphi, 'Bin', 'dcc32.exe'),
        [gedeminCompilerSwitch[compilationType], `${project}.dpr`],
        { ...basicExecOptions, cwd: pathGedemin }
      ).toString()
    );
    log.log(`${exeFileName} has been built...`);

    const exeOpt = { ...basicExecOptions, cwd: pathEXE };

    log.log(execFileSync('StripReloc.exe', ['/b', exeFileName], exeOpt).toString());
    log.log('relocation section has been stripped from EXE file...');

    if (project === 'gedemin' && compilationType === 'DEBUG') {
      log.log(execFileSync('tdspack.exe', ['-e -o -a', exeFileName], exeOpt).toString());
      log.log('debug information has been optimized...');
    }

    log.log(execFileSync(path.join(binEditbin, 'editbin.exe'), ['/SWAPRUN:NET', exeFileName], exeOpt).toString());
    log.log(`swaprun flag has been set on ${exeFileName} file...`);

    log.log(`${exeFileName} has been successfully built...`);
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
  const cleanupConfigFile = (project: Project) => {
    /** Файл конфигурации проекта для компиляции */
    const cfgFileName = path.join(pathGedemin, project + '.cfg');

    /** Файл для сохранения текущей конфигурации */
    const savedCfgFileName = path.join(pathGedemin, project + '.current.cfg');

    if (existsSync(savedCfgFileName)) {
      copyFileSync(savedCfgFileName, cfgFileName);
      log.log(`previous ${project}.cfg file has been restored...`);
      unlinkSync(savedCfgFileName);
    };
  };


  /** Инкремент версии */
  const incVer = () => {
  /** RC-файл версии  */
  const gedeminVerRCFileName = path.join(pathGedemin, 'gedemin_ver.rc');
  /** RES-файл версии  */
  const gedeminVerResFileName = path.join(pathGedemin, 'gedemin_ver.res');
  /** Путь рисунков */
  const pathImages = path.resolve(pathGedemin, '..\\images');

    const rcText = readFileSync(gedeminVerRCFileName).toString().trim().split('\n');

    if (rcText.length !== 31) {
      throw new Error('Invalid gedemin_ver.rc');
    }

    // extract current build number from second string of .rc file: FILEVERSION 2, 9, 5, 11591
    const buildNumber = parseInt(rcText[1].split(',')[3].trim()) + 1;

    let newRC = gedeminVerRC;
    newRC = newRC.replace(/<<BUILD_NUMBER>>/gi, buildNumber.toString());
    newRC = newRC.replace('<<YEAR>>', new Date().getFullYear().toString());

    writeFileSync(gedeminVerRCFileName, newRC);

    log.log(`Build number has been incremented to ${buildNumber}...`);
    log.log('gedemin_ver.rc saved...');

    if (existsSync(gedeminVerResFileName)) {
      unlinkSync(gedeminVerResFileName);
      log.log('previous gedemin_ver.res has been deleted...');
    }

    log.log(
      execFileSync(
        path.join(pathDelphi, 'Bin', 'brcc32.exe'),
        ['-fogedemin_ver.res', `-i${pathImages}`, 'gedemin_ver.rc'],
        { ...basicExecOptions, cwd: pathGedemin }
      ).toString()
    );
    log.log('gedemin_ver.res has been successfully built...');
  };

  /** Список проектов для компиляции */
  const ugProjectList = ['gedemin', 'gdcc', 'gedemin_upd'] as const;
  type Project = typeof ugProjectList[0] | typeof ugProjectList[1] | typeof ugProjectList[2];

  /** Количество шагов процесса */
  const steps = 5 + ugProjectList.length * 3;

  /** Начало процесса */
  log.startProcess('Gedemin compilation', steps);

  log.log(`Read params: ${JSON.stringify(params, undefined, 2)}`);
  log.log(`Compilation type: ${compilationType}`);
  log.log(`Gedemin root dir: ${rootGedeminDir}`);

  runProcess('Check prerequisites', checkPrerequisites);
  runProcess('Pull latest sources', pullSources);
  runProcess('Clear DCU folder', clearDCU);
  runProcess('Increment version', incVer);

  for (const pr of ugProjectList) {
    runProcess(`Prepare config files for ${pr}`, () => prepareConfigFile(pr));
    runProcess(`Build ${pr}`, () => buildProject(pr));
    runProcess(`Clean up after building ${pr}`, () => cleanupConfigFile(pr));
  }

  runProcess('Create portable version archive', createArhive);

  /** Окончание процесса */
  log.finishProcess();
};