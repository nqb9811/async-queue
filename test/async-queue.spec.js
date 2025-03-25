const { AsyncQueue } = require('..');

describe('Async queue specs', () => {
  test('should run async operations sequentially', async () => {
    const queue = new AsyncQueue();
    const operationElapsedTimes = [];
    const operationPromises = [];
    const elapsed = performance.now();

    let promise = queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 100);
    });
    operationPromises.push(promise);

    queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(performance.now() - elapsed);
        resolve();
      }, 10);
    });
    operationPromises.push(promise);

    await Promise.all(operationPromises);
    expect(operationElapsedTimes.every((elapsed) => elapsed >= 100)).toBe(true);
  });

  test('should not break when one operation rejects', async () => {
    const queue = new AsyncQueue();
    const operationPromises = [];

    let promise = queue.process((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Test'));
      }, 50);
    });
    operationPromises.push(promise);

    promise = queue.process((resolve) => {
      setTimeout(() => {
        resolve(10);
      }, 10);
    });
    operationPromises.push(promise);

    await expect(operationPromises[0]).rejects.toThrow('Test');
    await expect(operationPromises[1]).resolves.toBe(10);
  });

  test('should not break if there is unexpected error thrown in an operation', async () => {
    const queue = new AsyncQueue();
    const operationPromises = [];

    let promise = queue.process((resolve, reject) => {
      throw new Error('Test1');
    });
    operationPromises.push(promise);

    promise = queue.process((resolve) => {
      return Promise.reject(new Error('Test2'));
    });
    operationPromises.push(promise);

    await expect(operationPromises[0]).rejects.toThrow('Test1');
    await expect(operationPromises[1]).rejects.toThrow('Test2');
  });
});
