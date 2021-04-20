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

const main = async (params: IParams) => {
  const log: ILog[] = [];
  const semaphore = new Semaphore();
  const bot = await tg(params, () => semaphore.queueLength);

  console.log('Telegram bot has been successfully started!');
  await bot.broadcast(`Hi there again!\n\nSeems that server was reloaded.\nI'm eager to start building projects.\nJust give me new sources.`);

  const app = new Koa();
  const router = new Router();
  const octokit = new Octokit({ auth: params.pat });

  router.get('/log', async (ctx) => {
    const l = log.map(
      ({ logged, repo, state, message, url }) =>
        `${dateFormat(logged, 'dd.mm.yy HH:MM:ss')} -- ${repo} -- ${state} -- <a href="${url}">${message}</a>`
    );

    let data;
    const logFile = getLogFileName(params.ciDir);
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

    const broadcastCommitMessage = async () => {
      await bot.broadcast(`User **${body.pusher.name}** has committed code into **${branch}** branch of **${body.repository.name}** repository.`, 'MarkdownV2');
      await bot.broadcast(`<a href="${url}">${message}</a>`, 'HTML');
      if (!semaphore.permits) {
        await bot.broadcast(`Building of the project will be queued...`);
      }
    }

    broadcastCommitMessage();

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

  router.post('/webhook/gedemin', prepareHook('gedemin-private',
    async (branch) => {
      if (branch === 'india') {
        bot.broadcast(`I'm about to start building gedemin.exe 🏗️`);

        const res =
          await buildWorkbench(ug, bot, { compilationType: 'DEBUG', commitIncBuildNumber: false })
          &&
          await buildWorkbench(ug, bot, { compilationType: 'LOCK', commitIncBuildNumber: false })
          &&
          await buildWorkbench(ug, bot, { compilationType: 'PRODUCT', commitIncBuildNumber: true });

        if (res) {
          bot.broadcast(`gedemin.exe has been successfully built 🏁🏁🏁 `);
        }

        return res;
      } else {
        bot.broadcast(`I will build gedemin.exe only from india branch.`);
        return true;
      }
    }
  ));

  router.post('/webhook/gedemin-apps', prepareHook('gedemin-apps',
    async (branch) => {
      if (branch === 'master') {
        bot.broadcast(`I'm about to start building apps 🏗️`);
        return buildWorkbench(mi, bot);
      } else {
        bot.broadcast(`I will build apps only from master branch.`);
        return true;
      }
    }
  ));

  app
    .use(bodyParser({
      jsonLimit: '40mb',
      textLimit: '40mb'
    }))
    .use(router.routes())
    .use(router.allowedMethods());

  const httpServer = http.createServer(app.callback());

  httpServer.listen(params.buildServerPort, () => console.info(`>>> HTTP server is running at http://localhost:${params.buildServerPort}`) );
};

main(parseParams());
