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
    c_switch: '+',
    cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;WITH_INDY;'
  },
  DEBUG: {
    d_switch: '+',
    o_switch: '-',
    c_switch: '+',
    cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;EXCMAGIC_GEDEMIN;WITH_INDY'
  },
  LOCK: {
    d_switch: '+',
    o_switch: '-',
    c_switch: '-',
    cond: 'SPLASH;MESSAGE;SYNEDIT;GEDEMIN;GED_LOC_RUS;FR4;WITH_INDY'
  },
}

export const gedeminCfgTemplate =
`-$A+
-$B-
-$C<<C_SWITCH>>
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
-AWinTypes=Windows;WinProcs=Windows;DbiTypes=BDE;DbiProcs=BDE;DbiErrs=BDE;
-H+
-W+
-M
-$M16384,1048576
-K$00400000
-E"../exe"
-N"../dcu"
-LE"../bpl"
-LN"../bpl"
-U"<<GEDEMIN_SRC_PATH>>"
-O"<<GEDEMIN_SRC_PATH>>"
-I"<<GEDEMIN_SRC_PATH>>"
-R"<<GEDEMIN_SRC_PATH>>"
-D<<COND>>
`;

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
  'swipl/pthreadGC2.dll',
  'gsdbquery.dll'
];

export const gedeminVerRC =
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

}`;
