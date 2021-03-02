//FIXME: было бы неплохо дать краткое описание процесса компиляции. чтомы берем, откуда, для чего, что и куда помещаем


/**
 * Текущий функционал
 *    Снятие из гита последних исходников
 *    Компиляция нового экзешника заданного типа
 *    Формирование архива по файлу списка
 */

import { execFileSync, ExecFileSyncOptionsWithStringEncoding } from 'child_process';
import { existsSync, readFileSync, readdirSync, unlinkSync } from 'fs';
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

  /**
   * Папка архива
   */
  archiveDir: string;

  /**
   * Полные пути к используемым программам,
   * расположенным вне каталога gedemin\EXE\
   */
  pathDelphi?: string;
  binDelphi?: string;
  binEditbin?: string;
  binWinRAR?: string;
};

const defaultParams: Required<Pick<IParams, 'pathDelphi' | 'binDelphi' | 'binEditbin' | 'binWinRAR'>> = {
  pathDelphi: 'c:\\Program Files\\Borland\\Delphi5\\',
  binDelphi: 'c:\\Program Files\\Borland\\Delphi5\\Bin',
  binEditbin: '',
  binWinRAR: 'c:\\Program Files\\WinRAR\\'
};

/**
 *
 * @param params
 */
export function ug(log: Log) {

  const paramsFile = process.argv[2];

  if (!paramsFile || !existsSync(paramsFile)) {
    console.error('Full name of the file with build process parameters must be specified as a first command line argument.');
    return;
  }

  const params = JSON.parse(readFileSync(paramsFile, {encoding:'utf8', flag:'r'})) as IParams;

  const {
    compileType,
    rootGedeminDir  } = { ...defaultParams, ...params };

  /**
   * В процессе компиляции DCU, DCP, BPL файлы помещаются в эту папку.
   */
  const pathDCU = path.join(rootGedeminDir, 'gedemin', 'DCU');

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
   * компиляция работает c maxBuffer 2M
   * время компиляции примерно 30 сек (i5 8G SSD)
   * на всякий случай maxBuffer и timeout ставим больше
   * гит и прочие программы вписываются в параметры для компиляции
   */

  const execOptions: ExecFileSyncOptionsWithStringEncoding = {
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 1024 * 1024 * 4,
    timeout: 60 * 1000,
    encoding: 'utf8',
    cwd: rootGedeminDir
  };

  log.startProcess('Gedemin compilation', 2);

  log.log(`Read params: ${JSON.stringify(params, undefined, 2)}`);
  log.log(`Compilation type: ${compileType}`);
  log.log(`Gedemin root dir: ${rootGedeminDir}`);

  log.startProcess('Pull latest sources');

  try {
    log.log('git checkout master...');
    log.log(execFileSync('git', ['checkout', 'master'], execOptions).toString());
    log.log('git pull origin master...');
    log.log(execFileSync('git', ['pull', 'origin', 'master'], execOptions).toString());
  } catch(e) {
    log.error(e.message)
    return;
  };

  log.finishProcess();

  log.startProcess('Clear DCU folder');

  try {
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
  } catch(e) {
    log.error(e.message)
    return;
  };

  log.finishProcess();

  log.finishProcess();
};