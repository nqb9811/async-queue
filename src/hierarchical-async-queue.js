const { OperationAbortedError } = require('./exception');
const { HierarchicalStore } = require('./hierarchical-store');

class HierarchicalAsyncQueue {
  constructor(pathSeparator) {
    this._hierarchicalStore = new HierarchicalStore(pathSeparator);
    this._operationSubmittedCounter = 0;
    this._pendingOperations = new Set();
  }

  process(path, executor) {
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
      submittedCounter: ++this._operationSubmittedCounter,
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

    const node = this._hierarchicalStore.getOrAddIfNotExist(path);

    if (!node.data) {
      node.data = {
        lastSubmittedOperation: operation,
      };
    }

    this._pendingOperations.add(operation);
    this._waitOrProcess(node, operation);

    return { promise, abort };
  }

  _waitOrProcess(node, operation) {
    const blockingNodes = [
      ...this._hierarchicalStore.getNonEmptyAncestors(node), // possibly blocked by parent
      ...this._hierarchicalStore.getNonEmptyDescendants(node), // possibly blocked by children,
    ];

    if (node.data.lastSubmittedOperation !== operation) {
      blockingNodes.push(node); // possibly blocked by itself (another operation submitted before)
    }

    let blockingNode = blockingNodes[0];

    for (let i = 1; i < blockingNodes.length; i++) {
      if (
        blockingNodes[i].data.lastSubmittedOperation.submittedCounter
        > blockingNode.data.lastSubmittedOperation.submittedCounter
      ) {
        blockingNode = blockingNodes[i];
      }
    }

    operation.promise
      .catch(() => null) // to make sure the finally logic is called
      .finally(() => {
        if (node.data.lastSubmittedOperation === operation) {
          node.remove();
        }

        this._pendingOperations.delete(operation);

        if (!this._pendingOperations.size) {
          this._operationSubmittedCounter = 0;
        }
      });

    if (blockingNode) {
      blockingNode.data.lastSubmittedOperation.promise
        .catch(() => null) // to make sure the finally logic is called
        .finally(() => operation.execute());
    } else {
      operation.execute();
    }

    node.data.lastSubmittedOperation = operation;
  }
}

module.exports = {
  HierarchicalAsyncQueue,
};
