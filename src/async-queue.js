const { Queue } = require('./queue');

class AsyncQueue {
  constructor() {
    this._queue = new Queue();
    this._processing = false; // maybe another better way?
  }

  async process(callback) {
    return new Promise((resolve, reject) => {
      this._queue.enqueue(() => {
        callback(resolve, reject);
      });

      if (!this._processing) {
        this._getNextOperationAndProcess();
      }
    });
  }

  _getNextOperationAndProcess() {

  }
}

module.exports = {
  AsyncQueue
};
