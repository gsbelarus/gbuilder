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
   gedeminCompilerSwitch, gedeminArchiveName } from './const';

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
  pathDelphi?: string;
  /** Папка иполняемых файлов Delphi */
  binDelphi?: string;
  /** Папка утилиты Editbin */
  binEditbin?: string;
  /** Папка WinRAR */
  binWinRAR?: string;
};

/** Параметры по умолчанию */
const defaultParams: Required<Pick<IParams, 'pathDelphi' | 'binDelphi' | 'binEditbin' | 'binWinRAR'>> = {
  pathDelphi: 'c:\\Program Files\\Borland\\Delphi5',
  binDelphi: 'c:\\Program Files\\Borland\\Delphi5\\Bin',
  binEditbin: '',
  binWinRAR: 'c:\\Program Files\\WinRAR'
};

/**
 * Главная функция.
 * @param log Логгер.
 */
export function ug(log: Log) {

  const runProcess = (name: string, fn: () => void) => {
    log.startProcess(name);

    try {
      fn();
    } catch(e) {
      log.error(e.message);
      process.exit(1);
    };

    log.finishProcess();
  }

  const paramsFile = process.argv[2];

  if (!paramsFile || !existsSync(paramsFile)) {
    console.error('Full name of the file with build process parameters must be specified as a first command line argument.');
    return;
  }

  const params = JSON.parse(readFileSync(paramsFile, {encoding:'utf8', flag:'r'})) as IParams;

  const {
    compilationType,
    rootGedeminDir, archiveDir,
    pathDelphi, binDelphi, binEditbin, binWinRAR } = { ...defaultParams, ...params };

  /** Основная папка проекта */
  const pathGedemin = path.join(rootGedeminDir, 'Gedemin')
  /** В процессе компиляции DCU файлы помещаются в эту папку */
  const pathDCU = path.join(pathGedemin, 'DCU');
  /** Целевая папка компиляции */
  const pathEXE = path.join(pathGedemin, 'EXE');
  /** Папка файлов конфигурации и ресурсов */
  const pathCFG = path.join(pathGedemin, 'Gedemin');
  
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
   *    т.е. для выполнения execFileSync изменяется только execOptions.cwd
   */
    const execOptions: ExecFileSyncOptions = {
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 1024 * 1024 * 4,
    timeout: 60 * 1000,
    cwd: rootGedeminDir
  };

  /** Количество шагов процесса */
  const Steps = 6;
  log.startProcess('Gedemin compilation', Steps);

  log.log(`Read params: ${JSON.stringify(params, undefined, 2)}`);
  log.log(`Compilation type: ${compilationType}`);
  log.log(`Gedemin root dir: ${rootGedeminDir}`);

  runProcess('Pull latest sources', () => {
    log.log('git checkout master...');
    log.log(execFileSync('git', ['checkout', 'master'], execOptions).toString());
    log.log('git pull origin master...');
    log.log(execFileSync('git', ['pull', 'origin', 'master'], execOptions).toString());
  });

  runProcess('Clear DCU folder', () => {
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
  });

  /**
   * Подготавливаем CFG файл для компиляции.
   * Текущий файл сохраним с именем .current.cfg и восстановим в конце процесса.
   * Файл создадим из шаблона, подставив нужные значения в зависимости от типа компиляции.
   */

  /** Файл конфигурации проекта для компиляции */
  const gedeminCfgFileName = path.join(pathCFG, 'gedemin.cfg');
  /** Файла для сохранения текущей конфигурации */
  const gedeminSavedCfgFileName = path.join(pathCFG, 'gedemin.current.cfg');

  runProcess('Prepare config file', () => {
    if (existsSync(gedeminCfgFileName)) {
      copyFileSync(gedeminCfgFileName, gedeminSavedCfgFileName);
      log.log(`Existing gedemin.cfg file saved as ${gedeminSavedCfgFileName}...`);
    }

    let srcPath = gedeminSrcPath.join(';');

    while (srcPath.includes('<<delphi>>')) {
      srcPath = srcPath.replace('<<delphi>>', pathDelphi.replace(/\\/gi, '/'));
    }

    let cfgBody = gedeminCfgTemplate;

    while (cfgBody.includes('<<GEDEMIN_SRC_PATH>>')) {
      cfgBody = cfgBody.replace('<<GEDEMIN_SRC_PATH>>', srcPath);
    }

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
  });

  /** Целевой файл */
  const gedeminExeFileName = path.join(pathEXE, 'gedemin.exe');
  //const
  runProcess('Create new gedemin.exe', () => {
    if (existsSync(gedeminExeFileName)) {  
      unlinkSync(gedeminExeFileName);
      log.log('gedemin.exe deleted');
    }
    
    log.log('build gedemin.exe...');
    execOptions.cwd = pathCFG;
    log.log(`pathCFG: ${pathCFG}`);
    log.log(
      execFileSync(path.join(binDelphi, 'dcc32.exe'),
      [gedeminCompilerSwitch[compilationType], `gedemin.dpr`],
      execOptions).toString()
    );
    log.log('gedemin.exe built');

    execOptions.cwd = pathEXE;
    log.log(`pathEXE: ${pathEXE}`);    
    log.log(execFileSync('StripReloc.exe', ['/b', 'gedemin.exe'], execOptions).toString());
    log.log('StripReloc passed');

    if (compilationType === 'DEBUG') {
      log.log(execFileSync('tdspack.exe', ['-e -o -a', 'gedemin.exe'], execOptions).toString());
      log.log('tdspack passed');
    };

    log.log(execFileSync(path.join(binEditbin, 'editbin.exe'), ['/SWAPRUN:NET', 'gedemin.exe'], execOptions).toString());
    log.log('editbin passed');
    
    log.log('New version gedemin.exe ready to use');
  });

/** Файл архива */  
const gedeminArchiveFileName = path.join(archiveDir, gedeminArchiveName[compilationType]);  
/**
   * Синхронизация содержимого архива по файлу списка gedemin.lst 
   *    добавление файлов
   *    обновление файлов более новыми версиями по дате
   *    удаление файлов, которых нет в списке
   * Вопрос: где хранить файл списка gedemin.lst
   *    1) в папке EXE
   *    2) в папке архива (сейчас здесь)
   */
  const createArhive = () => {  
    log.log(
      execFileSync(path.join(binWinRAR, 'WinRAR.exe'),
        [ 'a', '-u', '-as', '-ibck',
          gedeminArchiveFileName,
          '@' + path.join(archiveDir, 'gedemin.lst') ],
        execOptions).toString()
    );
    if (existsSync(gedeminArchiveFileName)) {
      log.log(`See archive ${gedeminArchiveFileName}`);
    };
  };
  runProcess('Create portable version archive', createArhive);
  
  runProcess('Some clean up', () => {
    if (existsSync(gedeminSavedCfgFileName)) {
      copyFileSync(gedeminSavedCfgFileName, gedeminCfgFileName);
      log.log(`Previous gedemin.cfg file restored...`);
      unlinkSync(gedeminSavedCfgFileName);
      log.log(`Saved gedemin.cfg file deleted...`);
    }
  });

  log.finishProcess();
};