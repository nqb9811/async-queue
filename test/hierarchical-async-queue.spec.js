const { HierarchicalAsyncQueue } = require('..');

describe('Hierarchical async queue specs', () => {
  test('should run async operations on the same path sequentially', async () => {
    const queue = new HierarchicalAsyncQueue('/');
    const operationElapsedTimes = [];
    const operationPromises = [];
    const elapsed = performance.now();

    let promise = queue.process('path/to/test/file', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 100);
    });
    operationPromises.push(promise);

    queue.process('path/to/test/file', (resolve) => {
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

    // Sample hierarchy
    // A/
    // │── B/
    // │   ├── C

    let promise;

    // 1. operation on A, should run immediately
    promise = queue.process('/A', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 100);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(100);

    // 2. operation on C, should wait for A operation to complete
    promise = queue.process('/A/B/C', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 50);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(150);

    // 3. operation on B, should wait for C operation to complete
    promise = queue.process('/A/B', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 10);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(160);

    // 4. another operation on B, should wait for the previous operation on B to complete
    promise = queue.process('/A/B', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 30);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(190);

    // 4. another operation on A,
    // should wait for the last B operation to complete, not wait for the previous operation on A
    promise = queue.process('/A', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 50);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(240);

    // 4. another operation on A, now should wait for the previous operation on A
    promise = queue.process('/A', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 30);
    });
    operationPromises.push(promise);
    expectedOperationElapsedTimes.push(270);

    await Promise.all(operationPromises);
    expect(
      operationElapsedTimes.every((elapsed, i) => (
        elapsed >= expectedOperationElapsedTimes[i]),
      )).toBe(true);
  });

  test('should not have hierarchical blocking on different branch', async () => {
    const queue = new HierarchicalAsyncQueue('/');
    const operationElapsedTimes = [];
    const operationPromises = [];
    const elapsed = performance.now();

    // Sample hierarchy
    // root/
    // │── A
    // │── B

    let promise = queue.process('/root/A', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes[0] = performance.now() - elapsed;
        resolve();
      }, 100);
    });
    operationPromises.push(promise);

    promise = queue.process('/root/B', (resolve) => {
      setTimeout(() => {
        operationElapsedTimes[1] = performance.now() - elapsed;
        resolve();
      }, 10);
    });
    operationPromises.push(promise);

    await Promise.all(operationPromises);
    expect(operationElapsedTimes[0]).toBeGreaterThanOrEqual(100);
    expect(operationElapsedTimes[1]).toBeGreaterThanOrEqual(10);
    expect(operationElapsedTimes[1]).toBeLessThanOrEqual(20);
  });

  test('should not break when one operation rejects', async () => {
    const queue = new HierarchicalAsyncQueue('/');
    const operationPromises = [];

    let promise = queue.process('test', (resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Test1'));
      }, 50);
    });
    operationPromises.push(promise);

    promise = queue.process('test', (resolve, reject) => {
      throw new Error('Test2');
    });
    operationPromises.push(promise);

    promise = queue.process('test', (resolve) => {
      return Promise.reject(new Error('Test3'));
    });
    operationPromises.push(promise);

    promise = queue.process('test', (resolve) => {
      setTimeout(() => {
        resolve(10);
      }, 10);
    });
    operationPromises.push(promise);

    await expect(operationPromises[0]).rejects.toThrow('Test1');
    await expect(operationPromises[1]).rejects.toThrow('Test2');
    await expect(operationPromises[2]).rejects.toThrow('Test3');
    await expect(operationPromises[3]).resolves.toBe(10);
  });
});
