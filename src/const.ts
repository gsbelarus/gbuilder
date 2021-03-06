export const gedeminSrcPath = [
  '../component/indy',
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
  '../component',
  '../component/textdiff',
  '../component/gdc',
  '../component/repository',
  '../Component/tb2k/Source',
  '../Component/SynEdit/Source',
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
  '../queryfilter',
  '../classtree',
  '../attr',
  '../storage',
  '../newtransaction',
  '../bank',
  '../gudf',
  '../protect',
  '../gedemin',
  '../images',
  '../tax',
  '../backup',
  '<<DELPHI>>/Imports',
  '../component/repository/gd',
  '../test/dunit/src',
  '../test/GedeminTest'
];

// available switches
// -D_QEXPORT;SPLASH;MESSAGE;_REALIZATION;SYNEDIT;_PROTECT;GEDEMIN;_LOADMODULE;_MODEM;GED_LOC_RUS;_GEDEMIN_LOCK;_DEBUG;_LOCALIZATION;_NEW_GRID;FR4;_QBUILDER;_TEECHARTPRO;_DUNIT_TEST;WITH_INDY;_FULL_MODIFY;_EXCMAGIC_GEDEMIN;ID64

export const gedeminCfgVariables = {
  PRODUCT: {
    d_switch: '-',
    o_switch: '+',
    cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;WITH_INDY;'
  },
  DEBUG: {
    d_switch: '+',
    o_switch: '-',
    cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;EXCMAGIC_GEDEMIN;WITH_INDY'
  },
  LOCK: {
    d_switch: '+',
    o_switch: '-',
    cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;WITH_INDY'
  },
}

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

export const gedeminCompilerSwitch = {
  PRODUCT: '-b',
  DEBUG: '-b -vt',
  LOCK: '-b'
};

export const gedeminArchiveName = {
  PRODUCT: 'gedemin.rar',
  DEBUG: 'gedemin_debug.rar',
  LOCK: 'gedemin_lock.rar'};

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
  'udf/gudf.dll',
  'intl/fbintl.conf',
  'intl/fbintl.dll',
  'swipl/lib/memfile.dll',
  'swipl/lib/process.dll',
  'swipl/lib/readutil.dll',
  'swipl/gd_pl_state.dat ',
  'swipl/libgmp-10.dll',
  'swipl/libswipl.dll',
  'swipl/pthreadGC2.dll'
];

interface IProjectParams {
  [project: string]: {
    rc: string;
    loc?: 'GUDF';
    ext?: '.dll';
    dest?: 'EXE/UDF';
  }
};

export const projectParams: IProjectParams = {
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
  }
};

export const gedeminSQL = {
  1: [
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
  2: [
  'result2.sql',
  'gd_constants.sql',
  'gd_oper_const.sql',
  'gd_securityrole.sql',
  'gd_db_triggers.sql'
  ],
  header:
`SET NAMES WIN1251;
SET SQL DIALECT 3;
CREATE DATABASE '<<FB_CONNECT>>'
  USER '<<USER_NAME>>'
  PASSWORD '<<USER_PASS>>'
  PAGE_SIZE 8192
  DEFAULT CHARACTER SET WIN1251;
`
};
