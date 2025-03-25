const { HierarchicalAsyncQueue } = require('..');

describe('Hierarchical async queue specs', () => {
  test('should run async operations on the same path sequentially', async () => {
    const queue = new HierarchicalAsyncQueue('/');
    const operationElapsedTimes = [];
    const operationPromises = [];
    const elapsed = performance.now();
    let promise = queue.process('/path/to/test/file', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 100);
    });
    promise = operationPromises.push(promise);
    queue.process('/path/to/test/file', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 10);
    });
    operationPromises.push(promise);
    await Promise.all(operationPromises);
    expect(operationElapsedTimes.every((elapsed) => elapsed >= 100)).toBe(true);
  });
});
