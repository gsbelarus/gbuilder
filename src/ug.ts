//FIXME: было бы неплохо дать краткое описание процесса компиляции. чтомы берем, откуда, для чего, что и куда помещаем


/**
 * Текущий функционал
 *    Снятие из гита последних исходников
 *    Компиляция нового экзешника заданного типа
 *    Формирование архива по файлу списка
 */

export interface IParams {
  /**
   * Тип компиляции:
   *    выбор файла конфигурации, ключей компиляции, файла архива
   */
  compileType: 'PRODUCT' | 'DEBUG' | 'LOCK';

  /**
   * Корневая папка с полными исходниками Гедымина, включая Comp5.
   * В ней находятся папки Comp5 и Gedemin.
   */
  //FIXME: путь должен заканчиваться слэшем или не должен, или ему все равно?
  baseDir: string;

  /**
   * Папка архива
   */
  archiveDir: string;

  /**
   * Полные пути к используемым программам,
   * расположенным вне каталога gedemin\EXE\ (от корневой папки)
   */
  pathDelphi?: string;
  binDephi?: string;
  binEditbin?: string;
  binWinRAR?: string;
} 

/**
 *
 * @param params
 */
export function ug(params: IParams) {
  let { compileType, baseDir, archiveDir,
          pathDelphi, binDephi, binEditbin, binWinRAR
  } = params;
  
  const pathDelphiDefault = 'c:\\program files\\borland\\delphi5\\';
  const binEditbinDefault = '';
  const binWinRARDefault = 'C:\\Program Files\\WinRAR\\';

  if (pathDelphi === undefined) {pathDelphi = pathDelphiDefault};
  if (binDephi === undefined) {binDephi = `${pathDelphi}bin\\`};
  if (binEditbin === undefined) {binEditbin = binEditbinDefault};
  if (binWinRAR === undefined) {binWinRAR = binWinRARDefault};
  
  /**
   * Локальные пути
   */
  const pathDCU = `${baseDir}gedemin\\DCU\\`;
  const pathCFG = `${baseDir}gedemin\\gedemin\\`;
  const pathEXE = `${baseDir}gedemin\\EXE\\`;
    
  /**
   * Снимаем исходники с гита.
   * как он понимает репозиторий?
   * где логин пароль?
   *
   * если он берет уже из настроенного гита,
   * то надо отразить в инструкции по развертыванию,
   * что гит должен быть настроен, логин пароль введен и т.п.
   */

  //FIXME: а импорт не проходит?
  const { execFileSync } = require('child_process');
  const { readdirSync, unlinkSync, copyFileSync, existsSync,
          readFileSync, writeFileSync } = require('fs');
  /**
   * компиляция работает c maxBuffer 2M
   * время компиляции примерно 30 сек (i5 8G SSD)
   * на всякий случай maxBuffer и timeout ставим больше
   * гит и прочие программы вписываются в параметры для компиляции
   */

  //FIXME: почему let? потому что дальше cmdOptions.cwd = ...
  let execOptions =
    { stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024 * 4,
      timeout: 60 * 1000,
      cwd: `${baseDir}`
  };

  let ret: string = `Update Gedemin\n  compileType: ${compileType}\n  baseDir: ${baseDir}`
  let resExec: string = '';
  let resCmd: string = '';
  const strUpToDate: string = 'up to date';
  let isUpToDate: boolean = true;

  try {
    resExec = execFileSync('git', ['checkout', 'master'], execOptions).toString();
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  //ret = `${ret}\n${resExec}`;

  isUpToDate = resExec.search(strUpToDate) > 0;
  ret = `${ret}\n  isUpToDate: ${isUpToDate}`;
  // comment next line for use in production code
  isUpToDate = false; ret = `${ret}\n  isUpToDate (for test): ${isUpToDate}`;
  if (isUpToDate) {
    return ret;
  }
  
  try {
    resExec = execFileSync('git', ['pull', 'origin', 'master'], execOptions).toString();
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  //ret = `${ret}\n${resExec}`;

  ret = `${ret}\n  ready to compile`;

  ret = `${ret}\n  pathDCU: ${pathDCU}`;
  try {
    resCmd = readdirSync(`${pathDCU}`).filter
      (f => f.slice(-4).toLowerCase() === '.dcu').forEach
      (f => unlinkSync(`${pathDCU}${f}`)) ;
    ret = `${ret}\n  dcu deleted`;
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  //ret = `${ret}\n${resCmd}`

  ret = `${ret}\n  pathCFG: ${pathCFG}`;
  const gdCFG = `${pathCFG}gedemin.cfg`;
  try {
    resCmd = copyFileSync(`${gdCFG}`, `${pathCFG}gedemin.current.cfg`);
    ret = `${ret}\n  current project config saved`;
  } catch(e) {
    ret = `${ret}\n  current project config not exists`;
  };

  try {
    resCmd = copyFileSync(`${pathCFG}gedemin.${compileType}.cfg`, `${gdCFG}`);
    ret = `${ret}\n  project config prepared as '${compileType}'`;    
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };

  if ( `${pathDelphiDefault}` !== `${pathDelphi}` ) {
    ret = `${ret}\n  pathDelphi: ${pathDelphi}`;
    try {
      resCmd = readFileSync(`${gdCFG}`).toString();
      resCmd = resCmd.split(`${pathDelphiDefault}`).join(`${pathDelphi}`);
      resCmd = writeFileSync(`${gdCFG}`, resCmd);
      ret = `${ret}\n  project config changed`;
    } catch(e) {
      ret = `${ret}\n  ${e}`;
      return ret;
    };
  }
  
  ret = `${ret}\n  pathEXE: ${pathEXE}`;
  try {
    resCmd = unlinkSync(`${pathEXE}gedemin.exe`);
  } catch(e) {
    resCmd = '';
  };
  if ( existsSync(`${pathEXE}gedemin.exe`) ) {
    ret = `${ret}\nError: gedemin.exe not deleted`;
    return ret;    
  } else {
    ret = `${ret}\n  gedemin.exe deleted`;
  };

  ret = `${ret}\n  binDephi: ${binDephi}`;
  execOptions.cwd = `${pathCFG}`;
  const compiler_switch = {PRODUCT: '-b', DEBUG: '-b -vt', LOCK: '-b'};
  try {
    resExec = execFileSync(`${binDephi}dcc32.exe`,
      [compiler_switch[compileType], `gedemin.dpr`],
      execOptions).toString();
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  //ret = `${ret}\n${resExec}`;

  if ( existsSync(`${pathEXE}gedemin.exe`) ) {
    ret = `${ret}\n  gedemin.exe built`;
  } else {
    ret = `${ret}\nError: gedemin.exe not built`;
    return ret;
  };

  execOptions.cwd = `${pathEXE}`;
  try {
    resExec = execFileSync(`${pathEXE}StripReloc.exe`, ['/b', 'gedemin.exe'], execOptions).toString();
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  //ret = `${ret}\n${resExec}`;
  ret = `${ret}\n  stripreloc passed`;

  if (compileType === 'DEBUG') {
    try {
      resExec = execFileSync(`${pathEXE}tdspack.exe`, ['-e -o -a', 'gedemin.exe'], execOptions).toString();
    } catch(e) {
      ret = `${ret}\n  ${e}`;
      return ret;
    };
    //ret = `${ret}\n${resExec}`;
    ret = `${ret}\n  tdspack passed`;
  };

  ret = `${ret}\n  binEditbin: ${binEditbin}`;
  try {
    resExec = execFileSync(`${binEditbin}editbin.exe`, ['/SWAPRUN:NET', 'gedemin.exe'], execOptions).toString();
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  //ret = `${ret}\n${resExec}`;
  ret = `${ret}\n  editbin passed`;  

  try {
    resCmd = copyFileSync(`${pathCFG}gedemin.current.cfg`, `${gdCFG}`);
    ret = `${ret}\n  current project config restored`;
    try {
      resCmd = unlinkSync(`${pathCFG}gedemin.current.cfg`);
    } catch(e) {
      resCmd = '';
    };
    if ( existsSync(`${pathCFG}gedemin.current.cfg`) ) {
      ret = `${ret}\n  saved project config not deleted`;
    } else {
      ret = `${ret}\n  saved project config deleted`;
    };
  } catch(e) {
    ret = `${ret}\n  current project config not restored`;
  };

  /**
   * Синхронизация содержимого архива по файлу списка gedemin.lst 
   *    добавление файлов
   *    обновление файлов более новыми версиями по дате
   *    удаление файлов, которых нет в списке
   * Вопрос: где хранить файл списка gedemin.lst
   *    1) в папке EXE
   *    2) в папке архива (сейчас здесь)
   */
  ret = `${ret}\n  binWinRAR: ${binWinRAR}`;
  const archiveName = {PRODUCT: 'gedemin.rar', DEBUG: 'gedemin_debug.rar', LOCK: 'gedemin_lock.rar'};
  try {
    resExec = execFileSync(`${binWinRAR}WinRAR.exe`,
      [ 'a', '-u', '-as', '-ibck',
        `${archiveDir}${archiveName[compileType]}`,
        `@${archiveDir}gedemin.lst` ],
      execOptions).toString();
    ret = `${ret}\n  portable version archived`;        
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };

  ret = `${ret}\nUpdate Gedemin completed!`;
  return ret;
}

const ret_ug = ug(
  { compileType: 'PRODUCT',
    baseDir: 'c:\\golden\\gdc\\',
    archiveDir: 'c:\\golden\\archive\\',
    pathDelphi: 'C:\\Delphi5\\',
    //binDephi: 'C:\\Delphi5\\Bin\\',
    binEditbin: 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\VC\\Tools\\MSVC\\14.28.29333\\bin\\Hostx64\\x64\\'//,
    //binWinRAR: 'C:\\Program Files\\WinRAR\\'
  });
console.log(ret_ug);
