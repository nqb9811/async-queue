class OperationAbortedError extends Error {
  constructor() {
    super();
    this.message = 'Operation aborted';
  }
}

module.exports = {
  OperationAbortedError,
};
