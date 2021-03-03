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

export interface IParams {
  /**
   * Тип компиляции:
   *    выбор файла конфигурации, ключей компиляции, файла архива
   */
  compileType: 'PRODUCT' | 'DEBUG' | 'LOCK';

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
    compileType,
    rootGedeminDir,
    pathDelphi  } = { ...defaultParams, ...params };

  /** Основная папка проекта */
  const pathGD = path.join(rootGedeminDir, 'Gedemin')
  /** В процессе компиляции DCU файлы помещаются в эту папку */
  const pathDCU = path.join(pathGD, 'DCU');
  /** Папка проекта с файлами конфигурации и ресурсов */
  const pathCFG = path.join(pathGD, 'Gedemin');
  /** Целевая папка компиляции */
  const pathEXE = path.join(pathGD, 'EXE');

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
  const Steps = 3;
  log.startProcess('Gedemin compilation', Steps);

  log.log(`Read params: ${JSON.stringify(params, undefined, 2)}`);
  log.log(`Compilation type: ${compileType}`);
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
      log.log(`${cnt} files have been deleted.`);
    }
  });

  log.startProcess('Prepare config file');

  // /** Имя файла конфигурации проекта */
  // const gdCFG = path.join(pathCFG, 'gedemin.cfg');
  // /** Имя файла для сохранения текущей конфигурации */
  // const gdCurrentCFG = path.join(pathCFG, 'gedemin.current.cfg');
  // try {
  //   copyFileSync(gdCFG, gdCurrentCFG);
  //   log.log(`current project config saved`);
  // } catch(e) {
  //   log.error(e.message);
  // };

  // /** Имя файла конфигурации по типу компиляции */
  // const gdCompileTypeCFG = path.join(pathCFG, `gedemin.${compileType}.cfg`);
  // try {
  //   copyFileSync(gdCompileTypeCFG, gdCFG);
  //   log.log(`project config prepared as '${compileType}'`);
  // } catch(e) {
  //   log.error(e.message);
  //   return;
  // };

  // const pathDelphiDefault = defaultParams.pathDelphi;
  // if ( pathDelphiDefault !== pathDelphi ) {
  //   try {
  //     let cfgFile = readFileSync(gdCFG).toString();
  //     cfgFile = cfgFile.split(pathDelphiDefault).join(pathDelphi);
  //     writeFileSync(gdCFG, cfgFile);
  //     log.log('project config changed')
  //   } catch(e) {
  //     log.error(e.message);
  //     return;
  //   };
  // }

  log.finishProcess();

  log.finishProcess();
};