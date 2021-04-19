import { existsSync, readFileSync, statSync } from 'fs';
import { IParams } from './types';
import { tg } from './bot';

const paramsFile = process.argv[2];
let res = false;

if (!paramsFile || !existsSync(paramsFile)) {
  console.error('Full name of the file with build process parameters must be specified as a first command line argument.');
} else {
  let params: IParams;

  try {
    params = JSON.parse(readFileSync(paramsFile, {encoding:'utf8', flag:'r'})) as IParams;
  } catch(e) {
    throw new Error(`Error parsing JSON file ${paramsFile}. ${e}`);
  };

  tg(params);
};
