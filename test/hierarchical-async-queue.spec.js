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
    operationPromises.push(promise);

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

  test('should have additional hierarchical blocking', async () => {
    const queue = new HierarchicalAsyncQueue('/');
    const operationElapsedTimes = [];
    const expectedOperationElapsedTimes = [];
    const operationPromises = [];
    const elapsed = performance.now();

    // Sample hierarchy /A/B/C
    let promise;

    // 1. operation on A, should run immediately
    promise = queue.process('/a', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 100);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(100);

    // 2. operation on C, should wait for C operation to complete
    promise = queue.process('/a', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 50);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(150);

    // 3. operation on B, should wait for C operation to complete
    promise = queue.process('/a', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 10);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(160);

    // 4. second operation on B, should wait for first operation on B to complete
    promise = queue.process('/a', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 30);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(190);

    // 5.

    await Promise.all(operationPromises);
    expect(
      operationElapsedTimes.every((i, elapsed) => (
        elapsed >= expectedOperationElapsedTimes[i]),
      )).toBe(true);
  });
});
