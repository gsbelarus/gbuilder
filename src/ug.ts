/**
 * Текущий функционал
 *    Снятие из гита последних исходников
 *    Компиляция нового экзешника заданного типа
 *    Формирование архива по файлу списка
 */

export interface IParams {
  /**
   * Тип компиляции: ['product', 'debug', 'lock']
   *    выбор файла конфигурации, ключей компиляции, файла архива
   */
  compileType: string;

  /**
   * Корневая папка с полными исходниками Гедымина, включая Comp5. 
   * В ней находятся папки Comp5 и Gedemin.
   */
  baseDir: string;

  /**
   * Папка архива
   */
  archiveDir: string;

  /**
   * Полные пути к используемым программам,
   * расположенным вне каталога gedemin\EXE\ (от корневой папки)
   */
  binDephi: string; // Не забываем! В файлах конфигурации путь к Делфи должен быть такой же!
  binEditbin: string;
  binWinRAR: string;
} 

export function ug(params: IParams) {
  const { compileType, baseDir, archiveDir,
          binDephi, binEditbin, binWinRAR
  } = params;
  
  /**
   * Локальные пути 
   */
  const pathDCU: string = `${baseDir}gedemin\\DCU\\`;
  const pathCFG: string = `${baseDir}gedemin\\gedemin\\`;
  const pathEXE: string = `${baseDir}gedemin\\EXE\\`;
    
  /**
   * Снимаем исходники с гита.
   * как он понимает репозиторий?
   * где логин пароль?
   * 
   * если он берет уже из настроенного гита,
   * то надо отразить в инструкции по развертыванию,
   * что гит должен быть настроен, логин пароль введен и т.п.
   */
  
  const { execFileSync } = require('child_process');
  const { execSync } = require('child_process');
  /**
   * компиляция работает c maxBuffer 2M
   * время компиляции примерно 30 сек (i5 8G SSD)
   * на всякий случай maxBuffer и timeout ставим больше
   * гит и прочие программы вписываются в параметры для компиляции
   */
  let execOptions =
    { stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024 * 4,
      timeout: 60 * 1000,
      cwd: `${baseDir}`
  };
  /**
   * на командный процессор параметры можно поменьше
   */
  let cmdOptions =
    { stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 512,
      timeout: 10 * 1000,
      cwd: `${baseDir}`
  };

  let ret: string = `Update Gedemin\n  compileType: ${compileType}\n  baseDir: ${baseDir}`
  let resExec: string = '';
  let resCmd: string = '';
  const strUpToDate: string = 'up to date';
  let isUpToDate: boolean = true;
  let isExist: boolean = false;
  
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

  cmdOptions.cwd = `${pathDCU}`;
  try {
		resCmd = execSync(`dir ${pathDCU}*.dcu`, null, cmdOptions).toString();
	} catch(e) {
		resCmd = '';
  };
  //ret = `${ret}\n${resCmd}`;

	isExist = resCmd.search('.dcu') > 0;
  if (isExist) {
		ret = `${ret}\n  dcu found`
    try {
		  resCmd = execSync(`del ${pathDCU}*.dcu /q`, null, cmdOptions).toString();
      ret = `${ret}\n  dcu deleted`;
    } catch(e) {
      ret = `${ret}\n  ${e}`;
      return ret;
    };
	} else {
		ret = `${ret}\n  dcu not found`;
	};

  ret = `${ret}\n  pathCFG: ${pathCFG}`;

  cmdOptions.cwd = `${pathCFG}`;
  try {
    resCmd = execSync(`copy ${pathCFG}gedemin.cfg ${pathCFG}gedemin.current.cfg /y`, null, cmdOptions).toString();
    ret = `${ret}\n  current project config saved`;
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  try {
    resCmd = execSync(`copy ${pathCFG}gedemin.${compileType}.cfg ${pathCFG}gedemin.cfg /y`, null, cmdOptions).toString();
    ret = `${ret}\n  project config prepared as '${compileType}'`;    
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };

  ret = `${ret}\n  pathEXE: ${pathEXE}`;

  cmdOptions.cwd = `${pathEXE}`;
  try {
    resCmd = execSync(`del ${pathEXE}gedemin.exe /q`, null, cmdOptions).toString();
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  try {
		resCmd = execSync(`dir ${pathEXE}gedemin.exe`, null, cmdOptions).toString();
	} catch(e) {
    resCmd = '';
  };
  isExist = resCmd.search('gedemin.exe') > 0;
  if (isExist) {
		ret = `${ret}\nError: gedemin.exe not deleted`;
    return ret;    
  } else {
    ret = `${ret}\n  gedemin.exe deleted`;
  };

  ret = `${ret}\n  binDephi: ${binDephi}`;
  execOptions.cwd = `${pathCFG}`;
  const compiler_switch = {product: '-b', debug: '-b -vt', lock: '-b'};
  try {
		resExec = execFileSync(`${binDephi}dcc32.exe`,
      [compiler_switch[compileType], `gedemin.dpr`],
      execOptions).toString();
	} catch(e) {
		ret = `${ret}\n  ${e}`;
		return ret;
  };
  //ret = `${ret}\n${resExec}`;

  try {
		resCmd = execSync(`dir ${pathEXE}gedemin.exe`, null, cmdOptions).toString();
	} catch(e) {
    resCmd = '';
  };
  isExist = resCmd.search('gedemin.exe') > 0;
  if (isExist) {
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

  if (compileType === 'debug') {
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

  cmdOptions.cwd = `${pathCFG}`;
  try {
    resCmd = execSync(`copy ${pathCFG}gedemin.current.cfg ${pathCFG}gedemin.cfg /y`, null, cmdOptions).toString();
    ret = `${ret}\n  current project config restored`;
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };

  try {
    resCmd = execSync(`del ${pathCFG}gedemin.current.cfg /q`, null, cmdOptions).toString();
    ret = `${ret}\n  saved project config deleted`;
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };

  /**
   * Обязательно chdir с последующим execSync консольной версии архиватора
   */
  const process_cwd: string = `${process.cwd()}`
  try {
    process.chdir(`${pathEXE}`);
    ret = `${ret}\n  directory changed to ${process.cwd()}`;
  } catch (e) {
		ret = `${ret}\n  ${e}`;
		return ret;
  }
  /**
   * Синхронизация содержимого архива по файлу списка gedemin.lst 
   *    добавление, обновление более новыми версиями по дате,
   *    а также удаление файлов, которых нет в списке
   */
  ret = `${ret}\n  binWinRAR: ${binWinRAR}`;
  const archiveName = {product: 'gedemin.rar', debug: 'gedemin_debug.rar', lock: 'gedemin_lock.rar'};
  try {
		resCmd = execSync(`"${binWinRAR}rar.exe"` +
      ` a -u -as` +
      ` ${archiveDir}${archiveName[compileType]}` +
      ` @${archiveDir}gedemin.lst`,
      null,
        cmdOptions).toString();
    //ret = `${ret}\n${resCmd}`;        
    ret = `${ret}\n  portable version archived`;  
	} catch(e) {
		ret = `${ret}\n  ${e}`;
		return ret;
  };

  try {
    process.chdir(`${process_cwd}`);
    ret = `${ret}\n  directory changed back to ${process_cwd}`;
  } catch (e) {
		ret = `${ret}\n  ${e}`;
		return ret;
  }

  ret = `${ret}\nUpdate Gedemin completed!`;
  return ret;
}

const ret_ug = ug(
  { compileType: ['product', 'debug', 'lock'][0],
    baseDir: 'c:\\golden\\gdc\\',
    archiveDir: 'c:\\golden\\archive\\',
    binDephi: 'C:\\Delphi5\\Bin\\',
    binEditbin: 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\VC\\Tools\\MSVC\\14.28.29333\\bin\\Hostx64\\x64\\',
    binWinRAR: 'C:\\Program Files\\WinRAR\\'
  });
console.log(ret_ug);
