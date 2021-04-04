import { Log } from "./log";

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
  /** Папка БД */
  baseDir: string;
  /** Папка файлов для инстоляции */
  instDir: string;
  /** Папка дистрибутивов */
  distribDir: string;
  /** Папка настроек */
  settingDir: string;
  /** Папка Delphi */
  pathDelphi: string;
  /** Папка утилиты Editbin */
  binEditbin: string;
  /** Папка WinRAR */
  binWinRAR: string;
  /** Папка InnoSetup */
  binInnoSetup: string;
  /** Папка Firebird */
  binFirebird: string;
  /** Upload files to web site */
  upload?: boolean;
  /** */
  logFile?: string;
  /** */
  maxLogSize?: number;
  /** */
  srcBranch: string;
  /** */
  commitIncBuildNumber?: boolean;
  /** Строка подключения к серверу файреберд. Имя сервера и порт. По-умолчанию localhost/3050 */
  fbConnect?: string;
  /** Имя пользователя для подключения к серверу файреберд. По-умолчанию, SYSDBA */
  fbUser?: string;
  /** Пароль пользователя файреберд */
  fbPassword?: string;
  /** personal access token for github */
  pat?: string;
};

export type BuildFunc = (params: IParams, log: Log) => Promise<void>;
