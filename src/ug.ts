/**
 * Начнаем с простого. Функция снимает из гита последние исходники.
 */

// new feature goes here...
// optimization

export interface IParams {
  /**
   * Это корневая папка с полными исходниками Гедымина, включая Comp5. 
   * В ней находятся папки Comp5 и Gedemin.
   */
  compileType: string;
  baseDir: string;
  pathDCU: string;
  pathCFG: string;
  pathEXE: string;
  binDephi: string;
  binEditbin: string;
} 

export function ug(params: IParams) {

  const { baseDir, compileType,
          pathDCU, pathCFG, pathEXE,
          binDephi, binEditbin
  } = params;
  
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

  let execOptions =
    { stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024 * 4,
      timeout: 60 * 1000,
      cwd: baseDir
  };
  let cmdOptions =
    { stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 1024 * 512,
    timeout: 10 * 1000,
    cwd: baseDir
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
  ret = `${ret}\n  pathDCU: ${baseDir}${pathDCU}`;

  cmdOptions.cwd = `${baseDir}${pathDCU}`;
  try {
		resCmd = execSync(`dir ${baseDir}${pathDCU}*.dcu`, null, cmdOptions).toString();
	} catch(e) {
		resCmd = '';
  };
  //ret = `${ret}\n${resExec}`;

	isExist = resCmd.search('.dcu') > 0;
  if (isExist) {
		ret = `${ret}\n  dcu found`
    try {
		  resCmd = execSync(`del ${baseDir}${pathDCU}*.dcu /q`, null, cmdOptions).toString();
      ret = `${ret}\n  dcu deleted`;
    } catch(e) {
      ret = `${ret}\n  ${e}`;
      return ret;
    };
	} else {
		ret = `${ret}\n  dcu not found`;
	};

  ret = `${ret}\n  pathCFG: ${baseDir}${pathCFG}`;

  cmdOptions.cwd = `${baseDir}${pathCFG}`;
  try {
    resCmd = execSync(`copy ${baseDir}${pathCFG}gedemin.cfg ${baseDir}${pathCFG}gedemin.current.cfg /y`, null, cmdOptions).toString();
    ret = `${ret}\n  current project config saved`;
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  try {
    resCmd = execSync(`copy ${baseDir}${pathCFG}gedemin.${compileType}.cfg ${baseDir}${pathCFG}gedemin.cfg /y`, null, cmdOptions).toString();
    ret = `${ret}\n  project config prepared as '${compileType}'`;    
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };

  ret = `${ret}\n  pathEXE: ${baseDir}${pathEXE}`;

  cmdOptions.cwd = `${baseDir}${pathEXE}`;
  try {
    resCmd = execSync(`del ${baseDir}${pathEXE}gedemin.exe /q`, null, cmdOptions).toString();
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };
  try {
		resCmd = execSync(`dir ${baseDir}${pathEXE}gedemin.exe`, null, cmdOptions).toString();
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
  execOptions.cwd = `${baseDir}${pathCFG}`;
  let compiler_switch = {product: '-b', debug: '-b -vt', lock: '-b'};
  try {
		resExec = execFileSync(`${binDephi}dcc32.exe`, [compiler_switch[compileType], 'gedemin.dpr'], execOptions).toString();
	} catch(e) {
		ret = `${ret}\n  ${e}`;
		return ret;
  };
  //ret = `${ret}\n${resExec}`;

  try {
		resCmd = execSync(`dir ${baseDir}${pathEXE}gedemin.exe`, null, cmdOptions).toString();
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
  
  execOptions.cwd = `${baseDir}${pathEXE}`;
  try {
		resExec = execFileSync(`${baseDir}${pathEXE}StripReloc.exe`, ['/b', 'gedemin.exe'], execOptions).toString();
	} catch(e) {
		ret = `${ret}\n  ${e}`;
		return ret;
  };
  //ret = `${ret}\n${resExec}`;
  ret = `${ret}\n  stripreloc passed`;

  if (compileType === 'debug') {
    try {
      resExec = execFileSync(`${baseDir}${pathEXE}tdspack.exe`, ['-e', '-o', '-a', 'gedemin.exe'], execOptions).toString();
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

  cmdOptions.cwd = `${baseDir}${pathCFG}`;
  try {
    resCmd = execSync(`copy ${baseDir}${pathCFG}gedemin.current.cfg ${baseDir}${pathCFG}gedemin.cfg /y`, null, cmdOptions).toString();
    ret = `${ret}\n  current project config restored`;
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };

  try {
    resCmd = execSync(`del ${baseDir}${pathCFG}gedemin.current.cfg /q`, null, cmdOptions).toString();
    ret = `${ret}\n  saved project config deleted`;
  } catch(e) {
    ret = `${ret}\n  ${e}`;
    return ret;
  };

  ret = `${ret}\nUpdate Gedemin completed!`;
  return ret;
}

const ret_ug = ug(
  { compileType: ['product', 'debug', 'lock'][0],
    baseDir: 'c:\\golden\\gdc\\',
    pathDCU: 'gedemin\\DCU\\',
    pathCFG: 'gedemin\\gedemin\\',
    pathEXE: 'gedemin\\EXE\\',
    binDephi: 'C:\\Delphi5\\Bin\\',
    binEditbin: 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\VC\\Tools\\MSVC\\14.28.29333\\bin\\Hostx64\\x64\\'
  });
console.log(ret_ug);
