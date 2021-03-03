import dateFormat from 'dateformat';

interface ILogMessage {
  type: 'INFO' | 'WARNING' | 'ERROR';
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

interface ILog {
  log: (...messages: string[]) => void;
};

export class Log {
  private _log: ILog;
  private _process?: IProcess;

  constructor(log: ILog) {
    this._log = log;
  }

  private _fmtTime(date: Date) {
    return dateFormat(date, 'hh:MM:ss');
  }

  private _step() {
    return this._process && this._process.subProcesses.length ? `${this._process.subProcesses.length}/${this._process.steps} ` : '';
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

    this._log.log(`\x1b[33m${this._step()}${this._fmtTime(process.started)} STARTED: ${name}\x1b[0m`);
  }

  finishProcess() {
    if (!this._process) {
      throw Error('Process is not set');
    }

    let process;
    let step = '';

    if (this._process.subProcesses.length && !this._process.subProcesses[this._process.subProcesses.length - 1].finished) {
      process = this._process.subProcesses[this._process.subProcesses.length - 1];
      process.finished = new Date();
      step = this._step();
    } else {
      process = this._process;
      process.finished = new Date();
    }

    this._log.log(`${step}${this._fmtTime(process.finished)} FINISHED: ${process.name}`);
  }

  log(...messages: string[]) {
    for (const s of messages) {
      for (const m of s.split('\n')) {
        this._log.log(`${this._step()}${this._fmtTime(new Date())} ${m}`);
      }
    }
  }

  error(...messages: string[]) {
    for (const s of messages) {
      for (const m of s.split('\n')) {
        this._log.log(`\x1b[31m${this._step()}${this._fmtTime(new Date())} ${m}\x1b[0m`);
      }
    }
  }
};