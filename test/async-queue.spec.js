const { AsyncQueue } = require('..');

describe('Async queue specs', () => {
  test('should run async operations sequentially', async () => {
    const queue = new AsyncQueue();
    const operationElapsedTimes = [];
    const operationPromises = [];
    let promise = queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(100);
        resolve();
      }, 100);
    });
    promise = operationPromises.push(promise);
    queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(10);
        resolve();
      }, 10);
    });
    operationPromises.push(promise);
    promise = queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(50);
        resolve();
      }, 50);
    });
    operationPromises.push(promise);
    await Promise.all(operationPromises);
    expect(operationElapsedTimes).toEqual([100, 10, 50]);
  });

  test('should not break when one operation rejects', async () => {
    const queue = new AsyncQueue();
    const operationElapsedTimes = [];
    const operationPromises = [];
    let promise = queue.process((resolve, reject) => {
      setTimeout(() => {
        operationElapsedTimes.push(50);
        reject(new Error('Test'));
      }, 50);
    });
    operationPromises.push(promise);
    promise = queue.process((resolve) => {
      setTimeout(() => {
        operationElapsedTimes.push(10);
        resolve();
      }, 10);
    });
    operationPromises.push(promise);
    await Promise.allSettled(operationPromises);
    await expect(operationPromises[0]).rejects.toThrow('Test');
    expect(operationElapsedTimes).toEqual([50, 10]);
  });

  test('should not break if there is error thrown in an operation', async () => {
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
    await Promise.allSettled(operationPromises);
    await expect(operationPromises[0]).rejects.toThrow('Test1');
    await expect(operationPromises[1]).rejects.toThrow('Test2');
  });
});
