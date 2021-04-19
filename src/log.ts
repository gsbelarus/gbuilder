import dateFormat from 'dateformat';

type LogMessageType = 'INFO' | 'WARNING' | 'ERROR';

interface ILogMessage {
  type: LogMessageType;
  logged: Date;
  text: '';
};

interface IProcess {
  started: Date;
  finished?: Date;
  name: string;
  steps: number;
  subProcesses: IProcess[];
  messages: ILogMessage[];
};

interface ILogMeta {
  type?: LogMessageType;
  header?: true;
  bot?: true;
};

export interface ILog {
  log: (message: string, meta?: ILogMeta) => void;
};

export class Log {
  private _log: ILog[];
  private _process?: IProcess;

  constructor(log: ILog[]) {
    this._log = log;
  }

  startProcess(name: string, steps = 0) {
    const process = {
      started: new Date(),
      name,
      steps,
      subProcesses: [],
      messages: []
    };

    if (this._process) {
      this._process.subProcesses.push(process);
    } else {
      this._process = process;
    }

    this._iter(`STARTED: ${name}`, process.started, { header: true });
  }

  finishProcess(reset = false) {
    if (!this._process) {
      throw Error('Process is not set');
    }

    let process;

    if (this._process.subProcesses.length && !this._process.subProcesses[this._process.subProcesses.length - 1].finished) {
      process = this._process.subProcesses[this._process.subProcesses.length - 1];
      process.finished = new Date();
    } else {
      process = this._process;
      process.finished = new Date();
    }

    this._iter(`FINISHED: ${process.name}`, process.finished);

    if (reset) {
      this._process = undefined;
    }
  }

  private _iter(message: string, date = new Date(), meta?: ILogMeta) {
    const step = this._process?.subProcesses.length
      ? `${this._process.subProcesses.length.toString().padStart(this._process.steps.toString().length, ' ')}/${this._process.steps} `
      : '';
    const prefix = `${dateFormat(date, 'dd.mm.yyyy HH:MM:ss')} ${step}`;
    const m = message.trim().split('\n').map( (s, idx) => (idx ? ' '.repeat(prefix.length) : '') + s ).join('\n');
    this._log.forEach( ({ log }) => log(`${prefix}${m}`, meta) );
  }

  log(message: string, meta?: ILogMeta) {
    this._iter(message, new Date(), meta);
  }

  error(message: string) {
    this._iter(message, new Date(), { type: 'ERROR' });
  }
};