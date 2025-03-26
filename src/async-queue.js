const { OperationAbortedError } = require('./exception');

class AsyncQueue {
  constructor() {
    this._lastSubmittedOperation = null;
  }

  process(executor) {
    let resolve;
    let reject;
    let aborted = false;

    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    const abort = () => {
      // Only set the flag for usage in the execute function
      // If the current is rejected immediately, the latter could start before the former completes
      aborted = true;
    };

    const operation = {
      promise,
      execute: () => {
        if (aborted) {
          return reject(new OperationAbortedError());
        }

        try {
          const maybePromise = executor(resolve, reject);

          if (maybePromise instanceof Promise) {
            maybePromise.catch((error) => reject(error));
          }
        } catch (error) {
          reject(error);
        }
      },
    };

    this._awaitOrProcess(operation);

    return { promise, abort };
  }

  _awaitOrProcess(operation) {
    operation.promise
      .catch(() => null) // to make sure the finally logic is called
      .finally(() => {
        if (this._lastSubmittedOperation === operation) {
          this._lastSubmittedOperation = null;
        }
      });

    if (this._lastSubmittedOperation) {
      this._lastSubmittedOperation.promise
        .catch(() => null) // to make sure the finally logic is called
        .finally(() => operation.execute());
    } else {
      operation.execute();
    }

    this._lastSubmittedOperation = operation;
  }
}

module.exports = {
  AsyncQueue,
};
