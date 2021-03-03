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
  '../setup',
  '../imports',
  '../component',
  '../component/textdiff',
  '../component/gdc',
  '../component/repository',
  '../Component/tb2k/Source',
  '../Component/SynEdit/Source',
  '../common',
  '<<delphi>>/Source/Vcl',
  '<<delphi>>/Source/Toolsapi',
  '<<delphi>>/Ocx/Servers',
  '<<delphi>>/lib',
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
  '../bank',
  '../newtransaction',
  '../gudf',
  '../protect',
  '../gedemin',
  '../images',
  '../tax',
  '../backup',
  '<<delphi>>/Imports',
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
`
-$A+
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
-AWinTypes=Windows;WinProcs=Windows;DbiTypes=BDE;DbiProcs=BDE;DbiErrs=BDE
-H+
-W+
-M
-$M16384,1048576
-K$00400000
-E"..\exe"
-N"..\dcu"
-LE"..\bpl"
-LN"..\bpl"
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
