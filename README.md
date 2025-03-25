# Async Queue

Node.js \[hierarchical\] async queue to ensure async operations are processed sequentially

The package provides 2 classes:
- **AsyncQueue**: for sequential processing by submitting order (the 2nd operation only starts after the 1st has been completed)

- **HierarchicalAsyncQueue**: like the above AsyncQueue, with additional hierarchical (ancestor/descendant) blocking. That means, if an operation is submitted on a child/parent and there is already a submitted or processing operation on its parent/child, it will wait until the other completes

## Installation

```sh
npm i @nqb/async-queue
```

## Usage

Both classes exposes only 1 method "**.process(...)**" with the Promise-like syntax

### AsyncQueue

```js
const { AsyncQueue } = require('@nqb/async-queue');

// Create a queue instance
const queue = new AsyncQueue();
// Just call the process method with your async operations,
// The operations will be guaranteed to run sequentially
// For example:
const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(() => resolve(), ms))
};
const mockAsyncFailure = async () => {
  sleep(1000);
  throw new Error('test');
};

queue.process(async (resolve) => {
  await sleep(5000);
  resolve();
}).then(() => console.log('sleep for 5 seconds')); // log after 5 seconds
queue.process(async (resolve) => {
  await sleep(10000);
  resolve();
}).then(() => console.log('sleep for 10 seconds')); // log after 15 seconds
queue.process(async (resolve) => {
  await sleep(1000);
  resolve();
}).then(() => console.log('sleep for 1 seconds')); // log after 16 seconds
queue.process(async (resolve, reject) => {
  try {
    await mockAsyncFailure();
    resolve();
  } catch (error) {
    reject(error);
  }
}).catch((error) => console.error(error)); // log error after 17 seconds
```

### HierarchicalAsyncQueue

```js
// TODO
```

## License

[MIT](https://opensource.org/license/mit)
