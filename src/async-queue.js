const { Queue } = require('./queue');

class AsyncQueue {
  constructor() {
    this._queue = new Queue();
    this._processing = false; // maybe another better way?
  }

  async process(callback) {
    let resolve;
    let reject;

    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    const operation = {
      promise,
      execute: () => {
        try {
          const maybePromise = callback(resolve, reject);

          if (maybePromise instanceof Promise) {
            maybePromise.catch((error) => reject(error));
          }
        } catch (error) {
          reject(error);
        }
      },
    };

    this._queue.enqueue(operation);

    if (!this._processing) {
      this._getNextOperationAndProcess();
    }

    return promise;
  }

  _getNextOperationAndProcess() {
    if (!this._queue.length) {
      this._processing = false;
      return;
    }

    this._processing = true;

    const operation = this._queue.dequeue();
    const { promise, execute } = operation;

    promise
      .catch(() => null) // to make sure the finally logic is called
      .finally(() => this._getNextOperationAndProcess());

    execute();
  }
}

module.exports = {
  AsyncQueue,
};
