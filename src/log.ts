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

type LogFunction = (...messages: string[]) => void;

export class Log {
  private _logFunction: LogFunction;
  private _process?: IProcess;

  constructor(logFunction: LogFunction) {
    this._logFunction = logFunction;
  }

  startProcess(name: string, steps: number) {
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

    this._logFunction(`STARTED: ${name}`);
  }
};