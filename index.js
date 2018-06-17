const cluster = require('cluster');

if (cluster.isMaster) {
  const masterFunc = require('./master');
  masterFunc();
} else {
  process.on('message', (msg) => {
    const findBestRate = require('./findBestRate');
    const {
      vertices,
      edges,
      source_exchange,
      source_currency,
      destination_exchange,
      destination_currency,
    } = msg;
    const result = findBestRate(vertices, edges, {
      source_exchange,
      source_currency,
      destination_exchange,
      destination_currency,
    });
    process.send(result);
  });
}