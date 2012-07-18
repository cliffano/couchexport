var _ = require('underscore');

/** internal
 * Formatter#_column -> String
 *
 * Escape CSV column value and wrap it in double quotes.
 **/
function _column(data) {
if (data && data.toString().match(/Ranch.*/)) {
  console.log(">>data: " + data)
}
  return '"' + ((data) ? data.toString().replace(/"/g, '""') : '') + '"';
}

/** internal
 * Formatter#_line -> String
 *
 * Format CSV line, make it comma-separated.
 **/
function _line(data) {
  return data.join(',');
}

/**
 * class Formatter
 * - opts (Object): CSV formatter setting in format { 'Heading Title': function (doc) { return doc.prop; } }
 *   
 * Format document into a CSV line.
 **/
function Formatter(opts) {
  this.opts = opts;
}

/**
 * Formatter#format -> String
 * - doc (Object): a document
 *
 * Format a CSV line based on document field values.
 * If opts is specified, the functions will be used to determine the CSV line values.
 * Otherwise, all document fields will be used.
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
 * - doc (Object): a document
 *
 * Format CSV header.
 * If opts is specified, the keys of the opts will be used as header titles.
 * Otherwise, all keys of the document will be used.
 **/
Formatter.prototype.header = function () {
  
  var data = _.keys(this.opts);

  for (var i = 0, ln = data.length; i < ln; i += 1) {
    data[i] = _column(data[i]);
  }

  return _line(data) + '\n';
};

module.exports = Formatter;