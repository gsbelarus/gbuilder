type Unlock = () => void;

export class Semaphore {

  private _maxAllowed: number;
  private _permits: number;
  private _queue: Unlock[] = [];

  constructor(maxAllowed: number = 1) {
    this._maxAllowed = maxAllowed;
    this._permits = maxAllowed;
  }

  get permits() {
    return this._permits;
  }

  get queueLength() {
    return this._queue.length;
  }

  get acquired() {
    return this._maxAllowed - this._permits;
  }

  public async acquire(): Promise<void> {
    if (this._permits > 0) {
      this._permits -= 1;
      return;
    }

    return new Promise( resolve => this._queue.push(resolve) );
  }

  public release(): void {
    if (this._queue.length) {
      this._queue.shift()?.();
    } else {
      this._permits += 1;
    }

    if (this._permits > this._maxAllowed) {
      console.error('Release() has been called without previous acquire!');
    }
  }
}
