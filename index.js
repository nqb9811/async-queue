// Sample usage
const asyncQueue = null;

app.get('', async (req, res) => {
  // Must return promise for the async operation, but execute it in queue
  const data = await asyncQueue.process((resolve, reject) => {
    fs.readFile('test', (error, data) => {
      reject(error);
      resolve(data);
    });
  });

  res.json(data);
});

app.post('', async (req, res) => {
  await asyncQueue.process((resolve, reject) => {
    fs.writeFile('test', req.data, (error, data) => {
      reject(error);
      resolve(data);
    });
  });

  res.json('success');
});

// Hierarchical blocking?
