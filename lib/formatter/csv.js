var _ = require('underscore');

/** internal
 * Formatter#_column -> String
 *
 * Escape a CSV column value and wrap it in double quotes.
 **/
function _column(data) {
  return '"' + ((data) ? data.toString().replace(/"/g, '""') : '') + '"';
}

/** internal
 * Formatter#_line -> String
 *
 * Format CSV line, make it comma-separated (you know, the CS in CSV).
 **/
function _line(data) {
  return data.join(',');
}

/**
 * class Formatter
 * - opts (Object): CSV formatter setting in format { 'Heading Title': function _decorator(doc) { return doc.prop; } }
 **/
function Formatter(opts) {
  this.opts = opts;
}

/**
 * Formatter#format -> String
 * - doc (Object): CouchDB document
 *
 * Format the document into a comma separated values.
 * Each decorator function in opts will be applied to the document,
 * resulting in a set of values which will then be formatted into a CSV line.
 **/
Formatter.prototype.format = function (doc) {

  var data = [],
    self = this;

  _.keys(this.opts).forEach(function (opt) {
    data.push(_column(self.opts[opt](doc)));
  });

  return _line(data) + '\n';
};

/**
 * Formatter#header -> String
 *
 * Format the CSV header.
 * Column titles will be retrieved from the opts keys, then formatted into a CSV line.
 **/
Formatter.prototype.header = function () {
  
  var data = _.keys(this.opts);

  for (var i = 0, ln = data.length; i < ln; i += 1) {
    data[i] = _column(data[i]);
  }

  return _line(data) + '\n';
};

module.exports = Formatter;