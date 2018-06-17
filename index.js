const readline = require('readline');
const {
  get,
  set,
  uniq,
  isNil,
} = require('lodash');
const moment = require('moment');
const {
  generateVertex,
  pathString,
} = require('./utils');

const findBestRate = require('./findBestRate');

let vertices = [];
const edges = {};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const regexInput = /^(?<timestamp>\S+)\s(?<exchange>\S+)\s(?<source_currency>\S+)\s(?<destination_currency>\S+)\s(?<forward_factor>\d+\.*\d*)\s(?<backward_factor>\d+\.*\d*)$/gm;
const regexRequest = /^EXCHANGE_RATE_REQUEST\s(?<source_exchange>\S+)\s(?<source_currency>\S+)\s(?<destination_exchange>\S+)\s(?<destination_currency>\S+)$/gm;
const sameCurrencyRegex = (currency) => new RegExp(`^\\S+\\s${currency}$`);
const getDataRegex = /^(?<exchange>\S+)\s(?<currency>\S+)$/gm;

function setVertices(vertex) {
  vertices = uniq(vertices.concat(vertex));
}

function setEdges(start, end, newTimestamp, weight) {
  const edge = get(edges, pathString(start, end), {});
  const {
    timestamp
  } = edge;
  if (timestamp) {
    if (moment(timestamp).isAfter(moment(newTimestamp))) {
      return;
    }
  }
  set(edges, pathString(start, end), {
    timestamp: newTimestamp,
    weight,
  });
}

function setSameCurrencyEdges(newVertex, currency) {
  vertices.forEach(vertex => {
    if (vertex === newVertex) {
      return;
    }
    const isSameCurrency = sameCurrencyRegex(currency).test(vertex);
    if (isSameCurrency) {
      set(edges, pathString(vertex, newVertex), {
        weight: 1,
      });
      set(edges, pathString(newVertex, vertex), {
        weight: 1,
      });
    }
  });
}

function processDataInput(matches) {
  const {
    groups
  } = matches;
  const {
    timestamp,
    exchange,
    source_currency,
    destination_currency,
    forward_factor,
    backward_factor
  } = groups;
  const startVertex = generateVertex(exchange, source_currency);
  const endVertex = generateVertex(exchange, destination_currency);
  setVertices(startVertex);
  setVertices(endVertex);
  setEdges(startVertex, endVertex, timestamp, parseFloat(forward_factor));
  setEdges(endVertex, startVertex, timestamp, parseFloat(backward_factor));
  setSameCurrencyEdges(startVertex, source_currency);
  setSameCurrencyEdges(endVertex, destination_currency);
}

function processRequest(matches) {
  const {
    groups
  } = matches;
  const {
    source_exchange,
    source_currency,
    destination_exchange,
    destination_currency
  } = groups;
  const result = findBestRate(vertices, edges, {
    source_exchange,
    source_currency,
    destination_exchange,
    destination_currency
  });
  const {
    bestRate,
    path
  } = result;
  if (isNil(path)) {
    return;
  }
  console.log(`BEST_RATES_BEGIN ${source_exchange} ${source_currency} ${destination_exchange} ${destination_currency} ${bestRate}`);
  path.forEach(vertex => {
    console.log(vertex.split(' ').join(', '));
  })
  console.log('BEST_RATES_END');
}

rl.on('line', line => {
  regexInput.lastIndex = 0;
  const inputMatches = regexInput.exec(line);
  if (inputMatches) {
    processDataInput(inputMatches);
    return;
  }
  regexRequest.lastIndex = 0;
  const requestMatches = regexRequest.exec(line);
  if (requestMatches) {
    processRequest(requestMatches);
  }
});