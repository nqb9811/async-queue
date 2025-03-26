const { AsyncQueue } = require('..');

describe('Async queue specs', () => {
  test('should run async operations sequentially', async () => {
    const queue = new AsyncQueue();
    const operationElapsedTimes = [];
    const operationPromises = [];
    const elapsed = performance.now();

    const { promise: promise1 } = queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 100);
    });
    operationPromises.push(promise1);

    const { promise: promise2 } = queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 10);
    });
    operationPromises.push(promise2);

    await Promise.all(operationPromises);
    expect(operationElapsedTimes.length).toBe(2);
    expect(operationElapsedTimes[0]).toBeGreaterThanOrEqual(100);
    expect(operationElapsedTimes[1]).toBeGreaterThanOrEqual(110);
  });

  test('should not break when one operation rejects', async () => {
    const queue = new AsyncQueue();
    const operationPromises = [];

    const { promise: promise1 } = queue.process((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Test1'));
      }, 50);
    });
    operationPromises.push(promise1);

    const { promise: promise2 } = queue.process((resolve, reject) => {
      throw new Error('Test2');
    });
    operationPromises.push(promise2);

    const { promise: promise3 } = queue.process((resolve) => {
      return Promise.reject(new Error('Test3'));
    });
    operationPromises.push(promise3);

    const { promise: promise4 } = queue.process((resolve) => {
      setTimeout(() => {
        resolve(10);
      }, 10);
    });
    operationPromises.push(promise4);

    await expect(operationPromises[0]).rejects.toThrow('Test1');
    await expect(operationPromises[1]).rejects.toThrow('Test2');
    await expect(operationPromises[2]).rejects.toThrow('Test3');
    await expect(operationPromises[3]).resolves.toBe(10);
  });

  test('should abort operation', async () => {
    const queue = new AsyncQueue();
    const operationElapsedTimes = [];
    const operationPromises = [];
    const elapsed = performance.now();

    const { promise: promise1 } = queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 100);
    });
    operationPromises.push(promise1);

    const { promise: promise2, abort: abort2 } = queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 1000);
    });
    operationPromises.push(promise2);

    const { promise: promise3 } = queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 50);
    });
    operationPromises.push(promise3);

    abort2();
    await Promise.allSettled(operationPromises);
    await expect(promise2).rejects.toThrow('Operation aborted');
    expect(operationElapsedTimes.length).toBe(2);
    expect(operationElapsedTimes[0]).toBeGreaterThanOrEqual(100);
    expect(operationElapsedTimes[1]).toBeGreaterThanOrEqual(150);
    expect(operationElapsedTimes[1]).toBeLessThan(200);
  });
});
