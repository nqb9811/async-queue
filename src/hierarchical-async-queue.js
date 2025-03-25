const { HierarchicalStore } = require('./hierarchical-store');
const { Queue } = require('./queue');

class HierarchicalAsyncQueue {
  constructor(pathSeparator) {
    this._store = new HierarchicalStore(pathSeparator);
  }

  async process(path, executor) {
    let resolve;
    let reject;

    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    const operation = {
      path,
      submittedAt: performance.now(),
      promise,
      execute: () => {
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

    const node = this._store.getOrAddIfNotExist(path);

    if (!node.data) {
      node.data = {
        pendingOperations: new Queue(),
        lastSubmittedOperation: null,
        processingOperation: null,
      };
    }

    node.data.pendingOperations.enqueue(operation);
    node.data.lastSubmittedOperation = operation;

    this._checkIfOperationIsNotBlockedAndProcess(operation);

    return promise;
  }

  _checkIfOperationIsNotBlockedAndProcess(operation) {
    // is there parent/child of me?
    // which is the last submitted parent/child operation?
    // which is the processing parent/child operation?

    // is my another operation on me?
    // which is the last submitted parent/child operation?
    // which is the processing parent/child operation?
  }
}

module.exports = {
  HierarchicalAsyncQueue,
};
