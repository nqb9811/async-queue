const { HierarchicalStore } = require('./hierarchical-store');

class HierarchicalAsyncQueue {
  constructor(pathSeparator) {
    this._store = new HierarchicalStore(pathSeparator);
    // When an operation on a path starts, it checks if there is another path currently blocks it
    // If so, it sets an entry here
    // Then, when the blocking path resolves, it could start the operations of blocked paths
    this._blockRegistry = new Map();
  }

  async process(path, callback) {
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


}

module.exports = {
  HierarchicalAsyncQueue,
};
