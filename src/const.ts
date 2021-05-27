export const gedeminSrcPath = [
  '../queryfilter',
  '../classtree',
  '../component',
  '../component/gdc',
  '../component/indy',
  '../component/qexport/delphi5',
  '../component/repository',
  '../component/repository/gd',
  '../Component/SynEdit/Source',
  '../Component/tb2k/Source',
  '../component/textdiff',
  '../common/tdbf',
  '../jcl/Source',
  '../jcl/Source/windows',
  '../jcl/Source/vcl',
  '../jcl/Source/common',
  '../ibx',
  '../../comp5/xstorm',
  '../../comp5',
  '../FastReport 4/Source',
  '../FastReport 4/FastScript',
  '../FastReport 4/Source/ExportPack',
  '../FastReport 4/Source/ADO',
  '../FastReport 4/FastQB',
  '../FastReport 4/Source/IBX',
  '../FastReport 4/LibD5',
  '../setup',
  '../imports',
  '../common',
  '<<DELPHI>>/Source/Vcl',
  '<<DELPHI>>/Source/Toolsapi',
  '<<DELPHI>>/Ocx/Servers',
  '<<DELPHI>>/lib',
  '../designer',
  '../property',
  '../transaction',
  '../property/functionwizard',
  '../document',
  '../gdcFile',
  '../FastReport/source',
  '../report',
  '../zlib',
  '../../comp5/async4/source',
  '../const',
  '../inventory',
  '../wage',
  '../gadmin',
  '../security',
  '../addressbook',
  '../bugbase',
  '../greference',
  '../log',
  '../directorygood',
  '../messaging',
  '../attr',
  '../storage',
  '../newtransaction',
  '../realization',
  '../bank',
  '../gudf',
  '../protect',
  '../gedemin',
  '../images',
  '../tax',
  '../backup',
  '<<DELPHI>>/Imports',
  '../planning',
  '../Department',
  '../1stclass/source',
    '../test/dunit/src',
  '../test/GedeminTest'
];

// available switches
// -D_QEXPORT;SPLASH;MESSAGE;_REALIZATION;SYNEDIT;_PROTECT;GEDEMIN;_LOADMODULE;_MODEM;GED_LOC_RUS;_GEDEMIN_LOCK;_DEBUG;_LOCALIZATION;_NEW_GRID;FR4;_QBUILDER;_TEECHARTPRO;_DUNIT_TEST;WITH_INDY;_FULL_MODIFY;_EXCMAGIC_GEDEMIN;ID64

/*
export const gedeminCfgVariables = {
  PRODUCT: {
    d_switch: '-',
    o_switch: '+',
    cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;WITH_INDY;'
  },
  DEBUG: {
    d_switch: '+',
    o_switch: '-',
    cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;EXCMAGIC_GEDEMIN;WITH_INDY;DEBUG'
  },
  LOCK: {
    d_switch: '+',
    o_switch: '-',
    cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;WITH_INDY'
  },
};
*/

export const gedeminCfgTemplate =
`-$A+
-$B-
-$C+
-$D<<D_SWITCH>>
-$E-
-$F-
-$G+
-$H+
-$I+
-$J+
-$K-
-$L+
-$M-
-$N+
-$O<<O_SWITCH>>
-$P+
-$Q-
-$R-
-$S-
-$T-
-$U-
-$V-
-$W-
-$X+
-$Y+
-$Z1
-cg
-AWinTypes=Windows;WinProcs=Windows;DbiTypes=BDE;DbiProcs=BDE;DbiErrs=BDE
-H+
-W+
-M
-$M16384,1048576
-K$00400000
-E"../<<GEDEMIN_PROJECT_DEST>>"
-N"../dcu"
-LE"../bpl"
-LN"../bpl"
-U"<<GEDEMIN_SRC_PATH>>"
-O"<<GEDEMIN_SRC_PATH>>"
-I"<<GEDEMIN_SRC_PATH>>"
-R"<<GEDEMIN_SRC_PATH>>"
-D<<COND>>`;

/*
export const gedeminCompilerSwitch = {
  PRODUCT: '-b',
  DEBUG: '-b -vt',
  LOCK: '-b'
};

export const gedeminArchiveName = {
  PRODUCT: 'gedemin.rar',
  DEBUG: 'gedemin_debug.rar',
  LOCK: 'gedemin_lock.rar'
};
*/

/**
 * Список файлов для формирования архива портативной инстоляции.
 */
export const portableFilesList = [
  'gedemin.exe',
  'midas.dll',
  'midas.sxs.manifest',
  'gedemin.exe.manifest',
  'ib_util.dll',
  'icudt30.dll',
  'icuin30.dll',
  'icuuc30.dll',
  'fbembed.dll',
  'firebird.msg',
  'microsoft.vc80.crt.manifest',
  'msvcp80.dll',
  'msvcr80.dll',
  'gedemin_upd.exe',
  'gdcc.exe',
  'libeay32.dll',
  'ssleay32.dll',
  'gsdbquery.dll',
  'UDF/gudf.dll',
  'Intl/fbintl.conf',
  'Intl/fbintl.dll',
  'Swipl/lib/memfile.dll',
  'Swipl/lib/process.dll',
  'Swipl/lib/readutil.dll',
  'Swipl/gd_pl_state.dat',
  'Swipl/libgmp-10.dll',
  'Swipl/libswipl.dll',
  'Swipl/pthreadGC2.dll',
  'Help/fr24rus.chm',
  'Help/vbs55.chm'
];

export const cashPortableFilesList = [
  'USBPD.DLL',
  'PDPosiFlexCommand.DLL',
  'PDComWriter.DLL',
  'trhems.ini',
  'settings.xml',
  'ppServer.exe'
];

export interface IBuildParams {
  /** */
  label: string;
  /** Папка, куда будет компилироваться экзешник. Задается относительно корневой папки проекта Gedemin. */
  dstDir: 'EXE';
  /** git branch */
  srcBranch: string;
  /** ключи компилятора командной строки */
  dccSwitches: string;
  /** */
  cfgVariables: {
    d_switch: '-' | '+';
    o_switch: '-' | '+';
    cond: string;
  },
  /** */
  useTDSPack: boolean;
  /** */
  incBuildNumber: boolean;
  /** */
  commitBuildNumber: boolean;
  /** */
  exeSize?: number;
  /** */
  customRcFile?: string;
  /** */
  portableFilesList: string[];
  /** */
  archiveName: string;
  /** */
  uploadURL: string;
  /** */
  distrToFolder: string;
};

interface IBuildProjects {
  product: IBuildParams;
  debug: IBuildParams;
  lock: IBuildParams;
};

export const buildProjects: IBuildProjects = {
  product: {
    label: 'PRODUCT',
    dstDir: 'EXE',
    srcBranch: 'india',
    dccSwitches: '-b',
    cfgVariables: {
      d_switch: '-',
      o_switch: '+',
      cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;WITH_INDY'
    },
    useTDSPack: true,
    incBuildNumber: true,
    commitBuildNumber: true,
    portableFilesList,
    archiveName: 'gedemin.rar',
    uploadURL: 'http://gsbelarus.com/gs/content/upload2.php',
    distrToFolder: 'BETA'
  },
  debug: {
    label: 'DEBUG',
    dstDir: 'EXE',
    srcBranch: 'india',
    dccSwitches: '-b -vt',
    cfgVariables: {
      d_switch: '+',
      o_switch: '-',
      cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;EXCMAGIC_GEDEMIN;WITH_INDY;DEBUG'
    },
    useTDSPack: false,
    incBuildNumber: false,
    commitBuildNumber: false,
    portableFilesList,
    archiveName: 'gedemin_debug.rar',
    uploadURL: 'http://gsbelarus.com/gs/content/upload2.php',
    distrToFolder: 'DEBUG'
  },
  lock: {
    label: 'LOCK',
    dstDir: 'EXE',
    srcBranch: 'india',
    dccSwitches: '-b',
    cfgVariables: {
      d_switch: '+',
      o_switch: '-',
      cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;WITH_INDY'
    },
    useTDSPack: true,
    incBuildNumber: false,
    commitBuildNumber: false,
    portableFilesList,
    archiveName: 'gedemin_lock.rar',
    uploadURL: 'http://gsbelarus.com/gs/content/upload2.php',
    distrToFolder: 'LOCK'
  }
};

export interface IInstProject {
  /** FSFN -- полное имя файла с пакетом настроек */
  FSFN: string;
  /** SFN  -- имя файла заставки в каталоге images\splash */
  SFN: string;
  /** IFN  -- имя файла проекта установки, без расширения */
  IFN: string;
  /** AFN  -- имя файла с архивом установки, без расширения. */
  AFN: string;
  /** TFN  -- имя файла в каталоге дистрибутива установки */
  TFN: string;
  /** */
  buildParams: IBuildParams;
  /** */
  setupFileName?: string;
  /** */
  demoBk?: string;
  /** */
  copyCashFiles?: boolean;
};

interface IInstProjects {
  cash: IInstProject;
  cash_server: IInstProject;
  menufront: IInstProject;
  business: IInstProject;
  devel: IInstProject;
  plat: IInstProject;
  menuback: IInstProject;
  hotel: IInstProject;
  san: IInstProject;
};

export const instProjects: IInstProjects = {
  cash: {
    FSFN: 'Розничная торговля\\PositiveCash\\GS.PositiveCash.yml',
    SFN: 'complex.jpg',
    IFN: 'kkc_positive_cash',
    AFN: 'cash_setup',
    TFN: 'Касса',
    buildParams: { ...buildProjects.lock, exeSize: 20774976, customRcFile: 'gedemin_positive_cash_ver.rc' },
    copyCashFiles: true
  },
  cash_server: {
    FSFN: 'Розничная торговля\\Сервер\\GS.PositiveCash.CashServer.yml',
    SFN: 'complex.jpg',
    IFN: 'kkc_cash_server',
    AFN: 'cash_server_setup',
    TFN: 'Касса',
    buildParams: { ...buildProjects.lock, exeSize: 20774976, customRcFile: 'gedemin_positive_cash_ver.rc' },
    setupFileName: 'setup_server'
  },
  menufront: {
    FSFN: 'Меню\\Фронт-офис\\GS.PositiveCheck.yml',
    SFN: 'complex.jpg',
    IFN: 'kkc_positive_check',
    AFN: 'menufront_setup',
    TFN: 'Меню',
    buildParams: { ...buildProjects.lock, exeSize: 20774976, customRcFile: 'gedemin_positive_check_ver.rc' },
    setupFileName: 'setup_front',
    copyCashFiles: true
  },
  business: {
    FSFN: 'Общие\\Комплексная автоматизация.yml',
    SFN: 'complex.jpg',
    IFN: 'businesslocal',
    AFN: 'compl_setup',
    TFN: 'Комплексная автоматизация',
    buildParams: buildProjects.product,
    demoBk: 'demo.bk'
  },
  devel: {
    FSFN: 'Общие\\Общие данные.yml',
    SFN: 'complex.jpg',
    IFN: 'devellocal',
    AFN: 'devel_setup',
    TFN: 'Разработчик',
    buildParams: buildProjects.product,
  },
  plat: {
    FSFN: 'Банк\\Банк и касса.yml',
    SFN: 'doc.jpg',
    IFN: 'platlocal',
    AFN: 'plat_setup',
    TFN: 'Платежные документы',
    buildParams: buildProjects.product,
  },
  menuback: {
    FSFN: 'Меню\\2014 Бэк-офис\\GS.Общепит.back.yml',
    SFN: 'doc.jpg',
    IFN: 'menubacklocal',
    AFN: 'menuback_setup',
    TFN: 'Меню',
    buildParams: buildProjects.product,
    setupFileName: 'setup_back'
  },
  hotel: {
    FSFN: 'Гостиница\\GS.Гостиница.yml',
    SFN: 'doc.jpg',
    IFN: 'hotellocal',
    AFN: 'hotel_setup',
    TFN: 'Гостиница',
    buildParams: buildProjects.product,
  },
  san: {
    FSFN: 'Санаторий\\GS.Санаторий.yml',
    SFN: 'doc.jpg',
    IFN: 'sanlocal',
    AFN: 'san_setup',
    TFN: 'Санаторий',
    buildParams: buildProjects.product,
  }
} as const;

export type InstProject = keyof typeof instProjects;

interface IProject {
  rc?: string;
  loc?: 'GUDF' | 'Utility/MakeLBRBTree';
  ext?: '.dll';
  dest?: 'EXE/UDF' | 'SQL';
};

interface IProjects {
  gedemin: IProject;
  gdcc: IProject;
  gedemin_upd: IProject;
  gudf: IProject;
  makelbrbtree: IProject;
};

export const projects: IProjects = {
  gedemin: {
    rc:
`1 VERSIONINFO LOADONCALL MOVEABLE DISCARDABLE IMPURE
FILEVERSION 2, 9, 5, <<BUILD_NUMBER>>
PRODUCTVERSION 2, 9, 5, <<BUILD_NUMBER>>
FILEFLAGSMASK VS_FFI_FILEFLAGSMASK
FILEOS VOS__WINDOWS32
FILETYPE VFT_APP
{
 BLOCK "StringFileInfo"
 {
  BLOCK "041904E3"
  {
   VALUE "CompanyName", "Golden Software of Belarus, Ltd\\000"
   VALUE "FileDescription", "Gedemin\\000"
   VALUE "FileVersion", "2.9.5.<<BUILD_NUMBER>>\\000"
   VALUE "InternalName", "Gedemin\\000"
   VALUE "LegalCopyright", "Copyright (c) 2000-<<YEAR>> by Golden Software of Belarus, Ltd\\000"
   VALUE "LegalTrademarks", "Gedemin\\000"
   VALUE "OriginalFilename", "gedemin.exe\\000"
   VALUE "ProductName", "Gedemin\\000"
   VALUE "ProductVersion", "2.9\\000"
   VALUE "Comments", "Long Live Belarus!\\000"
  }

 }

 BLOCK "VarFileInfo"
 {
  VALUE "Translation", 1049, 1251
 }

}`
  },

  gdcc: {
    rc:
`LANGUAGE LANG_RUSSIAN,1

1 VERSIONINFO LOADONCALL MOVEABLE DISCARDABLE IMPURE
FILEVERSION 2, 9, 12, <<BUILD_NUMBER>>
PRODUCTVERSION 2, 9, 12, <<BUILD_NUMBER>>
FILEFLAGSMASK VS_FFI_FILEFLAGSMASK
FILEOS VOS__WINDOWS32
FILETYPE VFT_APP
{
 BLOCK "StringFileInfo"
 {
  BLOCK "041904E3"
  {
   VALUE "CompanyName", "Golden Software of Belarus, Ltd\\000"
   VALUE "FileDescription", "GDCC\\000"
   VALUE "FileVersion", "2.9.12.<<BUILD_NUMBER>>\\000"
   VALUE "InternalName", "Gedemin\\000"
   VALUE "LegalCopyright", "Copyright (c) 2000-<<YEAR>> by Golden Software of Belarus, Ltd\\000"
   VALUE "LegalTrademarks", "Gedemin\\000"
   VALUE "OriginalFilename", "gdcc.exe\\000"
   VALUE "ProductName", "Gedemin\\000"
   VALUE "ProductVersion", "2.9.12\\000"
   VALUE "Comments", "Long Live Belarus!\\000"
  }
 }

 BLOCK "VarFileInfo"
 {
  VALUE "Translation", 1049, 1251
 }
}`
  },

  gedemin_upd: {
    rc:
`LANGUAGE LANG_RUSSIAN,1

MAINICON ICON gedemin_blank.ico

1 VERSIONINFO LOADONCALL MOVEABLE DISCARDABLE IMPURE
FILEVERSION 2, 10, 0, <<BUILD_NUMBER>>
PRODUCTVERSION 2, 10, 0, <<BUILD_NUMBER>>
FILEFLAGSMASK VS_FFI_FILEFLAGSMASK
FILEOS VOS__WINDOWS32
FILETYPE VFT_APP
{
 BLOCK "StringFileInfo"
 {
  BLOCK "041904E3"
  {
   VALUE "CompanyName", "Golden Software of Belarus, Ltd\\000"
   VALUE "FileDescription", "Gedemin Upd\\000"
   VALUE "FileVersion", "2.10.<<BUILD_NUMBER>>\\000"
   VALUE "InternalName", "Gedemin\\000"
   VALUE "LegalCopyright", "Copyright (c) 2000-<<YEAR>> by Golden Software of Belarus, Ltd\\000"
   VALUE "LegalTrademarks", "Gedemin\\000"
   VALUE "OriginalFilename", "gedemin_upd.exe\\000"
   VALUE "ProductName", "Gedemin\\000"
   VALUE "ProductVersion", "2.10\\000"
   VALUE "Comments", "Long Live Belarus!\\000"
  }
 }

 BLOCK "VarFileInfo"
 {
  VALUE "Translation", 1049, 1251
 }
}`
  },

  gudf: {
    rc:
`LANGUAGE LANG_RUSSIAN,1

1 VERSIONINFO LOADONCALL MOVEABLE DISCARDABLE IMPURE
FILEVERSION 2, 5, 0, <<BUILD_NUMBER>>
PRODUCTVERSION 2, 5, 0, <<BUILD_NUMBER>>
FILEFLAGSMASK VS_FFI_FILEFLAGSMASK
FILEOS VOS__WINDOWS32
FILETYPE VFT_APP
{
 BLOCK "StringFileInfo"
 {
  BLOCK "041904E3"
  {
   VALUE "CompanyName", "Golden Software of Belarus, Ltd\\000"
   VALUE "FileDescription", "GUDF.DLL\\000"
   VALUE "FileVersion", "2.5.<<BUILD_NUMBER>>\\000"
   VALUE "InternalName", "GUDF\\000"
   VALUE "LegalCopyright", "Copyright (c) 2000-<<YEAR>> by Golden Software of Belarus, Ltd\\000"
   VALUE "LegalTrademarks", "Gedemin\\000"
   VALUE "OriginalFilename", "gudf.dll\\000"
   VALUE "ProductName", "Gedemin\\000"
   VALUE "ProductVersion", "2.5\\000"
   VALUE "Comments", "Long Live Belarus!\\000"
  }
 }

BLOCK "VarFileInfo"
 {
  VALUE "Translation", 1049, 1251
 }
}`,
    loc: 'GUDF',
    ext: '.dll',
    dest: 'EXE/UDF'
  },

  makelbrbtree: {
    loc: 'Utility/MakeLBRBTree',
    dest: 'SQL'
  }
};

export const gedeminSQL = {
  firstPass: [
    'gd_header.sql',
    'gd_create.sql',
    'gudf.sql',
    'gd_domains.sql',
    'gd_version.sql',
    'gd_link.sql',
    'gd_security.sql',
    'gd_place.sql',
    'gd_currency.sql',
    'wg_tblcal.sql',
    'gd_addressbook.sql',
    'gd_ourcompany.sql',
    'gd_ruid.sql',
    'at_attribute.sql',
    'gd_const.sql',
    'gd_script.sql',
    'gd_document.sql',
    'at_sync_procedures.sql',
    'flt_filter.sql',
    'bn_bankstatement.sql',
    'gd_upgrade.sql',
    'bug_bugbase.sql',
    'gd_command.sql',
    'gd_good.sql',
    'ac_accounting.sql',
    'msg_messaging.sql',
    'rp_registry.sql',
    'rp_report.sql',
    'evt_script.sql',
    'inv_movement.sql',
    'inv_price.sql',
    'gd_tax.sql',
    'at_setting.sql',
    'gd_file.sql',
    'gd_block_rule.sql',
    'rpl_database.sql',
    'gd_smtp.sql',
    'gd_autotask.sql'
  ],
  secondPass: [
    'gd_constants.sql',
     //'gd_oper_const.sql',
    'gd_securityrole.sql',
    'gd_db_triggers.sql'
  ],
  header:
`SET NAMES WIN1251;
SET SQL DIALECT 3;
CREATE DATABASE '<<FB_CONNECT>>'
USER '<<USER_NAME>>' PASSWORD '<<USER_PASS>>'
PAGE_SIZE 8192
DEFAULT CHARACTER SET WIN1251;
`
};

export const etalonDBFileName = 'etalon.fdb';

export const getFBConnString = (fbConnect: string | undefined, fullDBFileName: string) => `${fbConnect ?? 'localhost/3050'}${fbConnect ? ':' : ''}${fullDBFileName}`;
