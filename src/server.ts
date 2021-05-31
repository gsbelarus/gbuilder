import Koa from 'koa';
import Router from '@koa/router';
import http from 'http';
import bodyParser from 'koa-bodyparser';
import { Octokit } from '@octokit/core';
import { existsSync, readFileSync } from 'fs';
import { open } from 'fs/promises';
import { IParams } from './types';
import { buildWorkbench } from './buildWorkbench';
import dateFormat from 'dateformat';
import { ug } from './ug';
import { mi } from './mi';
import { getLogFileName } from './utils';
import { Semaphore } from './Semaphore';
import { PushEvent } from '@octokit/webhooks-types';
import { tg } from './bot';
import { buildProjects } from './const';

interface ILog {
  logged: Date;
  repo: string;
  state: string;
  message: string;
  url: string;
};

const parseParams = () => {
  const paramsFile = process.argv[2];

  if (!paramsFile || !existsSync(paramsFile)) {
    throw new Error('Full name of the file with build process parameters must be specified as a first command line argument.');
  } else {
    try {
      return JSON.parse(readFileSync(paramsFile, {encoding:'utf8', flag:'r'})) as IParams;
    } catch(e) {
      throw new Error(`Error parsing JSON file ${paramsFile}. ${e}`);
    }
  }
};

/*
const cert = readFileSync(path.resolve(process.cwd(), 'ssl/star.gdmn.app.crt'));
const key = readFileSync(path.resolve(process.cwd(), 'ssl/gdmn.app.key'));
const ca = readFileSync(path.resolve(process.cwd(), 'ssl/star.gdmn.app.ca-bundle'), {encoding:'utf8'})
  .split('-----END CERTIFICATE-----\r\n')
  .map(cert => cert +'-----END CERTIFICATE-----\r\n')
  .pop();

if (!ca) {
  throw new Error('No CA file or file is invalid');
}
*/

const main = async (params: IParams) => {
  const log: ILog[] = [];
  const semaphore = new Semaphore();
  const { pat, ciDir, srcGedeminAppsBranch, buildServerPort } = params;

  const compileGedemin = async (branch: string) => {
    let neverBuilt = true;

    for (const buildParams of Object.values(buildProjects)) {
      if (branch === buildParams.srcBranch) {
        await bot.broadcast(`I'm going to build ${buildParams.label} version of gedemin.exe 🏗️`);
        const res = await buildWorkbench(ug, bot, { buildParams });
        if (res) {
          await bot.broadcast(`gedemin.exe has been successfully built 🏁🏁🏁 `);
          neverBuilt = false;
        } else {
          await bot.broadcast(`Ooops! Something went wrong ☠️`);
          return res;
        }
      }
    }

    if (neverBuilt) {
      await bot.broadcast(`I don't build from ${branch} branch.`);
    }

    return true;
  };

  const makeSetup = async (branch: string) => {
    if (branch === srcGedeminAppsBranch) {
      await bot.broadcast(`I'm about to start building apps 🏗️`);
      return buildWorkbench(mi, bot);
    } else {
      await bot.broadcast(`I will build apps only from ${srcGedeminAppsBranch} branch.`);
      return true;
    }
  };

  const bot = await tg(params,
    () => `Tasks running: ${semaphore.acquired}...\nTasks in queue: ${semaphore.queueLength}...\n<a href="http://213.184.249.125:8087/log">Current log...</a>`,
    compileGedemin,
    makeSetup
  );

  console.log('Telegram bot has been successfully started!');
  await bot.broadcast(`Hi there again!\n\nSeems that server was reloaded.\nI'm eager to start building projects.\nJust give me new sources.`);

  const app = new Koa();
  const router = new Router();
  const octokit = new Octokit({ auth: pat });

  router.get('/log', async (ctx) => {
    const l = log.map(
      ({ logged, repo, state, message, url }) =>
        `${dateFormat(logged, 'dd.mm.yy HH:MM:ss')} -- ${repo} -- ${state} -- <a href="${url}">${message}</a>`
    );

    let data;
    const logFile = getLogFileName(ciDir);
    if (existsSync(logFile)) {
      let fh = await open(logFile, 'r');
      const buffer = await fh.readFile();
      data = buffer.toString().split('\n');
      await fh.close();
    }

    ctx.response.body =
      `<html>
        <body>
          <pre>Webhook server is working...</pre>
          <p/>
          <pre>${l.join('\n')}</pre>
          <p/>
          <pre>Only last 1000 log entries are shown.</pre>
          <pre>${data ? data.slice(-1000).join('\n') : 'no log file...'}</pre>
        </body>
      </html>`;
  });

  const run = async (fn: () => Promise<void>) => {
    await semaphore.acquire();
    try {
      await fn();
    } finally {
      await semaphore.release();
    }
  };

  const prepareHook = (repo: string, fn: (branch: string) => Promise<Boolean>) => async (ctx) => {
    console.log(JSON.stringify(ctx.request, undefined, 2));

    const body = (ctx.request as any).body;

    function isPush(body: any): body is PushEvent {
      return typeof body === "object" && typeof body.ref === 'string' && body.head_commit?.id && body.head_commit?.message && body.head_commit?.url;
    };

    if (!isPush(body) || !body.head_commit) {
      // это не наш запрос
      ctx.response.status = 200;
      return;
    }

    const branchRegExp = /refs\/heads\/(?<branch>[\w\-]+)/;
    const branch = branchRegExp.exec(body.ref)?.groups?.branch;

    if (!branch) {
      console.warn('No branch information found');
      ctx.response.status = 200;
      return;
    }

    const { id: sha, message, url } = body.head_commit;

    const updateState = state => octokit
      .request('POST /repos/{owner}/{repo}/statuses/{sha}', {
        owner: 'GoldenSoftwareLtd',
        repo,
        sha,
        state
      })
      .then( () => console.log(`state for ${repo} set to ${state}...`) )
      .then( () => { log.push({ logged: new Date(), repo, state, message, url }) } )

    if (message === 'Inc build number') {
      updateState('success');
    } else {
      await bot.broadcast(`User ${body.pusher.name} has committed code into ${branch} branch of ${body.repository.name} repository.`);
      await bot.broadcast(`Commit message:\n<a href="${url}">${message}</a>`, 'HTML');
      if (!semaphore.permits) {
        if (semaphore.acquired === 1) {
          await bot.broadcast(`There is a task running right now.\nBuilding of the project will be queued...`);
        } else {
          await bot.broadcast(`There are ${semaphore.acquired} tasks running right now.\nBuilding of the project will be queued...`);
        }
      }

      run( async () => {
        await updateState('pending');
        try {
          if (await fn(branch)) {
            await updateState('success');
          } else {
            await updateState('error');
          }
        } catch(e) {
          await updateState('error');
          console.error(e.message);
        }
      });
    }

    ctx.response.status = 200;
  };

  router.post('/webhook/gedemin', prepareHook('gedemin-private', compileGedemin));
  router.post('/webhook/gedemin-apps', prepareHook('gedemin-apps', makeSetup));

  app
    .use(bodyParser({
      jsonLimit: '40mb',
      textLimit: '40mb'
    }))
    .use(router.routes())
    .use(router.allowedMethods());

  const httpServer = http.createServer(app.callback());

  httpServer.listen(buildServerPort, () => console.info(`>>> HTTP server is running at http://localhost:${buildServerPort}`) );
};

main(parseParams());
