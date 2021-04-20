import { IParams } from './types';
import { Telegraf } from 'telegraf';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

export interface IBot {
  broadcast: (msg: string, parse_mode?: 'MarkdownV2' | 'HTML') => Promise<void>;
};

interface IBotUser {
  id: number;
};

interface IBotUsers {
  version: '1.0',
  data: IBotUser[];
};

const emptyBotUsers: IBotUsers = {
  version: '1.0',
  data: []
};

const readBotUsers = (fn: string) => {
  if (!existsSync(fn)) {
    return emptyBotUsers;
  }

  try {
    const rawData = readFileSync(fn, { encoding: 'utf-8'});
    const json = JSON.parse(rawData);
    if (json.version === '1.0' && Array.isArray(json.data)) {
      return json as IBotUsers;
    } else {
      return emptyBotUsers;
    }
  } catch(e) {
    console.error(`bot users file is corrupted. ${e}`);
    return emptyBotUsers;
  }
};

const writeBotUsers = (fn: string, botUsers: IBotUsers) => {
  const { dir } = path.parse(fn);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(fn, JSON.stringify(botUsers, undefined, 2), { encoding: 'utf-8' });
}

export const tg = async (params: IParams, getQueueLength: () => number): Promise<IBot> => {
  const { tgBotToken, ciDir } = params;
  const botUsersFN = path.join(ciDir, 'bot', 'botusers.json');

  if (!tgBotToken) {
    throw new Error('Bot token isnt specified!');
  }

  const botUsers = readBotUsers(botUsersFN);
  const bot = new Telegraf(tgBotToken);

  bot.start( (ctx) => {
    ctx.reply(`Welcome!\n\nI'm gBuilder bot!\n\nEvery time you commit something new to the gedemin-private or gedemin-apps repositories I will wake up and build projects from the fresh sources.`);

    const { id } = ctx.message.chat;
    if (!botUsers.data.find( u => u.id === id )) {
      botUsers.data.push({ id });
      writeBotUsers(botUsersFN, botUsers);
    }
  });

  bot.command('log', (ctx) => {
    ctx.reply(`Tasks in queue: ${getQueueLength()}...\n<a href="http://213.184.249.125:8087/log">Current log...</a>`, { parse_mode: 'HTML' });
  });

  await bot.launch();

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return {
    broadcast: async (msg: string, parse_mode?: 'MarkdownV2' | 'HTML') => {
      let i = 0;
      let changed = false;
      while (i < botUsers.data.length) {
        try {
          await bot.telegram.sendMessage(botUsers.data[i].id, msg, parse_mode && { parse_mode });
          i++;
        } catch (e) {
          // похоже этот пользователь удалился из нашего бота
          if (e.code === 403) {
            botUsers.data.splice(i, 1);
            changed = true;
          }
        }
      }

      if (changed) {
        writeBotUsers(botUsersFN, botUsers);
      }
    }
  }
};
