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
   gedeminCfgTemplate, gedeminCfgVariables, gedeminSrcPath,
   gedeminCompilerSwitch, gedeminArchiveName, portableFilesList, gedeminVerRC, gdccSrcPath } from './const';

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
  const runProcess = (name: string, fn: () => void, skip?: boolean) => {
    if (!skip) {
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

  /** Файл конфигурации проекта для компиляции */
  const gedeminCfgFileName = path.join(pathGedemin, 'gedemin.cfg');
  /** Файл для сохранения текущей конфигурации */
  const gedeminSavedCfgFileName = path.join(pathGedemin, 'gedemin.current.cfg');
  /**
   * Подготавливаем CFG файл для компиляции.
   * Текущий файл сохраним с именем gedemin.current.cfg и восстановим в конце процесса.
   * Файл создадим из шаблона, подставив нужные значения в зависимости от типа компиляции.
   */
  const prepareConfig = () => {
    if (existsSync(gedeminCfgFileName)) {
      copyFileSync(gedeminCfgFileName, gedeminSavedCfgFileName);
      log.log(`Existing gedemin.cfg file saved as ${gedeminSavedCfgFileName}...`);
    }

    let srcPath = gedeminSrcPath.join(';');
    srcPath = srcPath.replace(/<<DELPHI>>/gi, pathDelphi.replace(/\\/gi, '/'));

    let cfgBody = gedeminCfgTemplate;
    cfgBody = cfgBody.replace(/<<GEDEMIN_SRC_PATH>>/gi, srcPath);

    const cfgVariables = gedeminCfgVariables[compilationType];

    if (!cfgVariables) {
      throw new Error(`No cfg data for compilation type: ${compilationType}`);
    }

    cfgBody = cfgBody.replace('<<C_SWITCH>>', cfgVariables.c_switch);
    cfgBody = cfgBody.replace('<<D_SWITCH>>', cfgVariables.d_switch);
    cfgBody = cfgBody.replace('<<O_SWITCH>>', cfgVariables.o_switch);
    cfgBody = cfgBody.replace('<<COND>>', cfgVariables.cond);

    writeFileSync(gedeminCfgFileName, cfgBody);

    log.log(`Configuration file has been prepared and saved as ${gedeminCfgFileName}...`);
  };

  /** Файл GDCC-конфигурации */
  const gdccCfgFileName = path.join(pathGedemin, 'gdcc.cfg');
  /** Файл для сохранения текущей GDCC-конфигурации */
  const gdccSavedCfgFileName = path.join(pathGedemin, 'gdcc.current.cfg');
  /**
   * Подготавливаем CFG файл для компиляции GDCC
   * Текущий файл сохраним с именем gdcc.current.cfg и восстановим в конце процесса.
   * Файл создадим из шаблона, подставив нужные значения в зависимости от типа компиляции.
   */
  const prepareGdccConfig = () => {
    if (existsSync(gdccCfgFileName)) {
      copyFileSync(gdccCfgFileName, gdccSavedCfgFileName);
      log.log(`Existing dgcc.cfg file saved as ${gdccSavedCfgFileName}...`);
    }

    let srcPath = gdccSrcPath.join(';');
    srcPath = srcPath.replace(/<<DELPHI>>/gi, pathDelphi.replace(/\\/gi, '/'));

    let cfgBody = gedeminCfgTemplate;
    cfgBody = cfgBody.replace(/<<GEDEMIN_SRC_PATH>>/gi, srcPath);

    //const gdccType = compilationType;
    const gdccType = 'PRODUCT';
    const cfgVariables = gedeminCfgVariables[gdccType];

    if (!cfgVariables) {
      throw new Error(`No cfg data for compilation type: ${gdccType}`);
    }

    cfgBody = cfgBody.replace('<<C_SWITCH>>', cfgVariables.c_switch);
    cfgBody = cfgBody.replace('<<D_SWITCH>>', cfgVariables.d_switch);
    cfgBody = cfgBody.replace('<<O_SWITCH>>', cfgVariables.o_switch);
    cfgBody = cfgBody.replace('-D<<COND>>', '');
    cfgBody = cfgBody.replace('-$V-', '-$V+');
    cfgBody = cfgBody.replace('-$Y+', '-$YD');

    writeFileSync(gdccCfgFileName, cfgBody);

    log.log(`Configuration file has been prepared and saved as ${gdccCfgFileName}...`);
  };

  /** Целевой файл */
  const gedeminExeFileName = path.join(pathEXE, 'gedemin.exe');
  /** Компиляция нового экзешника заданного типа */
  const buildGedemin = () => {
    if (existsSync(gedeminExeFileName)) {
      unlinkSync(gedeminExeFileName);
      log.log('previous gedemin.exe has been deleted...');
    }

    log.log('building gedemin.exe...');
    log.log(pathGedemin);
    log.log(
      execFileSync(
        path.join(pathDelphi, 'Bin', 'dcc32.exe'),
        [gedeminCompilerSwitch[compilationType], 'gedemin.dpr'],
        { ...basicExecOptions, cwd: pathGedemin }
      ).toString()
    );
    log.log('gedemin.exe has been built...');

    log.log(`pathEXE: ${pathEXE}`);
    log.log(execFileSync('StripReloc.exe', ['/b', 'gedemin.exe'], { ...basicExecOptions, cwd: pathEXE }).toString());
    log.log('StripReloc passed...');

    if (compilationType === 'DEBUG') {
      log.log(execFileSync('tdspack.exe', ['-e -o -a', 'gedemin.exe'], { ...basicExecOptions, cwd: pathEXE }).toString());
      log.log('debug information has been packed...');
    };

    log.log(execFileSync(path.join(binEditbin, 'editbin.exe'), ['/SWAPRUN:NET', 'gedemin.exe'], { ...basicExecOptions, cwd: pathEXE }).toString());
    log.log('swaprun flag has been set on gedemin.exe file...');

    log.log('gedemin.exe has been successfully built...');
  };

  /** Целевой файл GDCC */
  const gdccExeFileName = path.join(pathEXE, 'gdcc.exe');
  /** Компиляция нового GDCC-экзешника */
  const buildGdcc = () => {
    if (existsSync(gdccExeFileName)) {
      unlinkSync(gdccExeFileName);
      log.log('previous gdcc.exe has been deleted...');
    }

    //const gdccType = compilationType;
    const gdccType = 'PRODUCT';

    log.log('building gdcc.exe...');
    log.log(pathGedemin);
    log.log(
      execFileSync(
        path.join(pathDelphi, 'Bin', 'dcc32.exe'),
        [gedeminCompilerSwitch[gdccType], 'gdcc.dpr'],
        { ...basicExecOptions, cwd: pathGedemin }
      ).toString()
    );
    log.log('gdcc.exe has been built...');

    log.log(`pathEXE: ${pathEXE}`);    
    log.log(execFileSync(path.join(binEditbin, 'editbin.exe'), ['/SWAPRUN:NET', 'gdcc.exe'], { ...basicExecOptions, cwd: pathEXE }).toString());
    log.log('swaprun flag has been set on gdcc.exe file...');

    log.log('gdcc.exe has been successfully built...');
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
      log.log(`Portable archive has been created ${gedeminArchiveFileName}...`);
    } else {
      throw new Error('Can not create portable archive!');
    };
  };

  /**
  * Вопрос: где хранить файл списка gedemin.lst
  *    1) в папке EXE
  *    2) в папке архива (сейчас здесь)
  */

  /** Восстановление сохраненного файла конфигурации */
  const configCleanUp = () => {
    if (existsSync(gedeminSavedCfgFileName)) {
      copyFileSync(gedeminSavedCfgFileName, gedeminCfgFileName);
      log.log(`Previous gedemin.cfg file restored...`);
      unlinkSync(gedeminSavedCfgFileName);
      log.log(`Saved gedemin.cfg file deleted...`);
    }

    if (existsSync(gdccSavedCfgFileName)) {
      copyFileSync(gdccSavedCfgFileName, gdccCfgFileName);
      log.log(`Previous gdcc.cfg file restored...`);
      unlinkSync(gdccSavedCfgFileName);
      log.log(`Saved gdcc.cfg file deleted...`);
    }
  };

  /** RC-файл версии  */
  const gedeminVerRCFileName = path.join(pathGedemin, 'gedemin_ver.rc');
  /** RES-файл версии  */
  const gedeminVerResFileName = path.join(pathGedemin, 'gedemin_ver.res');
  /** Путь рисунков */
  const pathImages = path.resolve(pathGedemin, '..\\images');

  /** Инкремент версии */
  const incVer = () => {
    const rcText = readFileSync(gedeminVerRCFileName).toString().trim().split('\n');

    if (rcText.length !== 31) {
      throw new Error('Invalid gedemin_ver.rc');
    }

    const buildNumber = parseInt(rcText[1].split(',')[3].trim()) + 1;

    let newRC = gedeminVerRC;
    newRC = newRC.replace(/<<BUILD_NUMBER>>/gi, buildNumber.toString());
    newRC = newRC.replace('<<YEAR>>', new Date().getFullYear().toString());

    writeFileSync(gedeminVerRCFileName, newRC);

    log.log(`Build number has been incremented to ${buildNumber}`);
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
    log.log('gedemin_ver.res has been built...');
  };

  /** Количество шагов процесса */
  const Steps = 10;
  log.startProcess('Gedemin compilation', Steps);

  log.log(`Read params: ${JSON.stringify(params, undefined, 2)}`);
  log.log(`Compilation type: ${compilationType}`);
  log.log(`Gedemin root dir: ${rootGedeminDir}`);

  runProcess('Check prerequisites', checkPrerequisites, true);
  runProcess('Pull latest sources', pullSources, true);
  runProcess('Clear DCU folder', clearDCU, false);
  runProcess('Prepare config file', prepareConfig, false);
  runProcess('Increment version', incVer, true);
  runProcess('Build gedemin.exe', buildGedemin, false);
  runProcess('Prepare GDCC config file', prepareGdccConfig, false);
  runProcess('Build gdcc.exe', buildGdcc, false);  
  runProcess('Some clean up', configCleanUp, false);
  runProcess('Create portable version archive', createArhive, true);

  log.finishProcess();
};