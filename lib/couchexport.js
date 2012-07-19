var _ = require('underscore'),
  db = require('./db');

/**
 * class CouchExport
 * - url (String): CouchDB URL in format http://user:pass@host:port
 **/
function CouchExport(url) {
  this.db = new db(url);
  this.formatter = {
    csv: require('./formatter/csv')
  };
  this.streamer = {
    filesystem: require('./streamer/filesystem')
  };
}

/**
 * CouchExport#exportToFile
 * - file (String): export file name, file extension will be used to determine the exported data format
 * - decorators (Object): report value decorator in format { 'Heading Title': function _decorator(doc) { return doc.prop; } }. This converts a document into a certain value which will be formatted (e.g. to a CSV line)
 * - indexOpts (Object): index retrieval options, format { db: 'databasename', design: 'designdocname', view: 'viewname', fetchSize: 1000000, createKeys: function (rows) {} }, createKeys function should construct an array of keys based on CouchDB result rows
 * - docsOpts (Object): docs retrieval options, format { db: 'databasename', design: 'designdocname', view: 'viewname', fetchSize: 1000000, createDoc: function (row) {} }, if design or view is not supplied then documents will be retrieved from the database, otherwise the view will be used
 * - cb (Function): standard cb(err, result) callback
 *
 * Export documents into a file.
 * 1. Retrieve a set of index from a view.
 * 2. Use the index to construct a set of keys, which will then be used to retrieve documents from either a database or a view (include_docs: true) 
 * 3. Format data segment constructed from the decorators and formatted by the type formatter.
 * 4. Stream each segment into the file.
 **/
CouchExport.prototype.exportToFile = function (file, decorators, indexOpts, docsOpts, cb) {

  indexOpts.createKeys = indexOpts.createKeys || function (rows) {
    return _.pluck(row, 'key');
  };
  docsOpts.createDoc = docsOpts.createDoc || function (row) {
    return row.doc;
  };

  function _formatterType() {
    var elems = file.split('.');
    return elems[elems.length - 1];
  }

  var formatter = new (this.formatter[_formatterType()])(decorators),
    streamer = new (this.streamer.filesystem)(file),
    self = this;

  function _indexFetchCb(rows, cb) {
    
    var keys = indexOpts.createKeys(rows);

    function _docsCb(rows) {
      rows.forEach(function (row) {
        var doc = docsOpts.createDoc(row);
        if (doc) {
          streamer.write(formatter.format(doc));
        }
      });
    }

    if (docsOpts.design && docsOpts.view) {
      self.db.fetchDocsFromView(docsOpts.db, docsOpts.design, docsOpts.view, keys, docsOpts.fetchSize, _docsCb, function (err, result) {
        cb(); // resume to next fetch
      });
    } else {
      self.db.fetchDocsFromDatabase(docsOpts.db, keys, docsOpts.fetchSize, _docsCb, function (err, result) {
        cb(); // resume to next fetch
      });
    }
  }

  function _indexEndCb(err, result) {
    if (!err) {
      streamer.end();
    }
    cb(err, result);
  }

  this.db.fetchIndex(indexOpts.db, indexOpts.design, indexOpts.view, indexOpts.fetchSize, _indexFetchCb, _indexEndCb);
};

module.exports = CouchExport;