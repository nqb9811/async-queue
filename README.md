# Async Queue

Node.js \[hierarchical\] async queue to ensure async operations are processed sequentially

It could be helpful when, for example, you want to prevent multiple asynchronous reads/writes to the same "target" or its parent/children, which may cause data conflicts or incorrect data state compared to read/write order

The package provides 2 classes:
- **AsyncQueue**: for sequential processing by submitting order (the 2nd only starts after the 1st has been completed)

- **HierarchicalAsyncQueue**: like the above AsyncQueue, with additional hierarchical (ancestor/descendant) blocking. That means, if an operation is submitted on a child/parent and there is already a submitted or processing operation on its parent/child, it will wait until the other completes

## Installation

```sh
npm i @nqb/async-queue
```

## Usage

Both classes exposes only 1 method "**.process(...)**" with the Promise-like syntax. The method returns a Promise which resolves and rejects based on your logic and an "abort" function to abort the operation

### AsyncQueue

```js
const { AsyncQueue } = require('@nqb/async-queue');

// Create a queue
const queue = new AsyncQueue();
// Just call the process method and pass the async operation
// For example, the below reads/writes are done in the same order as client requests
app.get('/config', async (req, res) => {
  const { promise, abort } = queue.process((resolve, reject) => {
    getConfig().then(resolve).catch(reject);
  });
  const config = await promise; // wait for the operation to complete and get resolved data
  abort(); // or abort it
  res.json({ config });
});
app.put('/config', async (req, res) => {
  const { promise, abort } = queue.process((resolve, reject) => {
    updateConfig().then(resolve).catch(reject);
  });
  await promise; // wait for the operation to complete
  abort(); // or abort it
  res.json({ status: 'ok' });
});
```

### HierarchicalAsyncQueue

```js
const { HierarchicalAsyncQueue } = require('@nqb/async-queue');

// Create a queue, an additional path separator is required
const queue = new HierarchicalAsyncQueue('/'); // here path separator is "/"
// Similar to the above AsyncQueue, just call the process method,
// but now we need the path along with the operation
// For example: this ensures the returned state is always matched with submitted request order
app.get('/documents', async (req, res) => {
  const { promise, abort } = queue.process('/documents', (resolve, reject) => {
    getDocuments().then(resolve).catch(reject);
  });
  const documents = await promise; // wait for the operation to complete and get resolved data
  abort(); // or abort it
  res.json({ documents });
});
app.post('/documents/:name', async (req, res) => {
  const { name } = req.params;
  const { promise, abort } = queue.process(`/documents/${name}`, (resolve, reject) => {
    addDocument(name).then(resolve).catch(reject);
  });
  await promise; // wait for the operation to complete
  abort(); // or abort it
  res.json({ status: 'ok' });
});
```

## License

[MIT](https://opensource.org/license/mit)
