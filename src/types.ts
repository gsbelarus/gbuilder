import { IBuildParams, InstProject } from "./const";
import { Log } from "./log";

export interface IParams {
  /** */
  buildParams: IBuildParams;
  /** */
  ciDir: string;
  /**
   * Корневая папка с полными исходниками Гедымина.
   * В ней находятся папки Comp5 и Gedemin.
   */
  rootGedeminDir: string;
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
  maxLogSize?: number;
  /** Ветка ПИ из которых будем собирать бд для инстоляции */
  srcGedeminAppsBranch: string;
  /** Строка подключения к серверу файреберд. Имя сервера и порт. По-умолчанию localhost/3050 */
  fbConnect?: string;
  /** Имя пользователя для подключения к серверу файреберд. По-умолчанию, SYSDBA */
  fbUser?: string;
  /** Пароль пользователя файреберд */
  fbPassword?: string;
  /** personal access token for github */
  pat?: string;
  /** port number for a build server */
  buildServerPort?: number;
  /** Список проектов для инстоляции */
  projectList: InstProject[];
  /** Токен телеграм бота */
  tgBotToken?: string;
};

export type BuildFunc = (params: IParams, log: Log) => Promise<void>;

type ProcessFuncA = () => Promise<void>;
type ProcessFuncB = () => void;
type ProcessFunc = ProcessFuncA | ProcessFuncB;
type ProcessDescriptor = {
  name: string;
  fn: ProcessFunc;
};
export type Processes = ProcessDescriptor[];
