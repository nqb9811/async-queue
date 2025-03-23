const { Queue } = require('./queue');

class AsyncQueue {
  constructor() {
    this._queue = new Queue();
  }

  async execute(callback) {
    return new Promise((resolve, reject) => {
      callback(resolve, reject);
    });
  }
}

module.exports = {
  AsyncQueue
};


fjgkgkgg