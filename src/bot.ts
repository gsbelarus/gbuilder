import { IParams } from './types';
import { Telegraf } from 'telegraf';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

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

const writeBotUsers = (fn: string, botUsers: IBotUsers) => 
  writeFileSync(fn, JSON.stringify(botUsers, undefined, 2), { encoding: 'utf-8' });

export const tg = async (params: IParams) => {
  const { tgBotToken, ciDir } = params;
  const botUsersFN = path.join(ciDir, 'bot', 'botusers.json');

  if (!tgBotToken) {
    throw new Error('Bot token isnt specified!');
  } 

  const botUsers = readBotUsers(botUsersFN);
  const bot = new Telegraf(tgBotToken);

  bot.start( (ctx) => {
    ctx.reply(`Welcome!`);
    
    const { id } = ctx.message.chat;
    if (!botUsers.data.find( u => u.id === id )) {
      botUsers.data.push({ id });
      writeBotUsers(botUsersFN, botUsers);
    }
  });

  await bot.launch();

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return {
    broadcast: (msg: string) => botUsers.data.forEach(
      u => bot.telegram.sendMessage(u.id, msg)
    )    
  }
};


