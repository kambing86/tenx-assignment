const {
  entries,
  forEach,
  mapValues,
  reduce,
  get,
  set,
} = require('lodash');
const {
  generateVertex,
  pathString,
} = require('./utils');

function getRate(rate, start, end) {
  return get(rate, pathString(start, end), 0);
}

function getNext(next, start, end) {
  return get(next, pathString(start, end));
}

module.exports = (vertices, edges, {
  source_exchange,
  source_currency,
  destination_exchange,
  destination_currency
}) => {
  // console.log('vertices', vertices);
  // console.log('edges', edges);
  // console.log(source_exchange, source_currency, destination_exchange, destination_currency);

  let rate = mapValues(edges, edge => mapValues(edge, value => value.weight));
  let next = {};

  entries(edges).forEach(([u, edgeCollection]) => {
    // console.log('u', u);
    // console.log('edgeCollection', edgeCollection);

    const path = reduce(edgeCollection, (result, value, key) => {
      result[key] = key;
      return result;
    }, {});
    // console.log('path', path);
    set(next, u, path);
  });

  // console.log('rate', rate);
  // console.log('next', next);

  forEach(vertices, k => {
    forEach(vertices, i => {
      forEach(vertices, j => {
        const compareRate = getRate(rate, i, k) * getRate(rate, k, j);
        if (getRate(rate, i, j) < compareRate) {
          set(rate, pathString(i, j), compareRate);
          set(next, pathString(i, j), getNext(next, i, k));
        }
      });
    });
  });

  // console.log('rate', rate);
  // console.log('next', next);
  const source = generateVertex(source_exchange, source_currency);
  const destination = generateVertex(destination_exchange, destination_currency);
  if (!getNext(next, source, destination)) {
    // console.log('empty');
    return undefined;
  }
  const path = [source];
  let currentPos = source;
  while (currentPos !== destination) {
    currentPos = getNext(next, currentPos, destination);
    path.push(currentPos);
  }
  const bestRate = getRate(rate, source, destination);
  return {bestRate, path};
};