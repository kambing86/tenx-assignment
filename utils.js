module.exports = {
  generateVertex(exchange, currency) {
    return `${exchange} ${currency}`;
  },
  pathString(start, end) {
    return `[${start}][${end}]`;
  },
};