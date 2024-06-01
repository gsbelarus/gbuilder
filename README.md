# gbuilder

## params

Change dir to the params and make a copy of `params.sample.json`. Name it `params.json`.
Put appropriate values into it. Below is the list of params with commentaries.

{
  "ciDir": "c:\\CI",
  "rootGedeminDir": "c:/golden/gedemin",
  "pathDelphi": "c:/Delphi5",
  "settingDir": "c:\\golden\\gedemin-apps",
  "binEditbin": "",
  "binWinRAR": "c:/Program Files/WinRAR",
  "binInnoSetup": "C:\\Program Files (x86)\\Inno Setup 5",
  "srcGedeminAppsBranch": "master",
  "upload": true,
  "maxLogSize": 10000000,
  "binFirebird": "C:/Program Files/FB25/bin",
  "fbConnect": "localhost/3053",
  
  /** user name and password for connecting to the Firebird server */ 
  "fbUser": "SYSDBA",
  "fbPassword": "********",

  "pat": "...",
  "buildServerPort": 8087,
  "projectList": ["cash", "cash_server", "menufront", "business", "devel", "plat", "menuback", "hotel", "san"],
  "tgBotToken": "some_token"
}