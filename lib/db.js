var _ = require('underscore'),
  async = require('async'),
  nano = require('nano');

/**
 * class Db
 * - url (String): CouchDB URL in format http://user:pass@host:port
 **/
function Db(url) {
  this.nano = nano(url);
}

// TODO: ndoc
/**
 * Db#fetchKeys
 * - dbName (String): database name
 * - viewName (String): view name within the database
 * - designDocName (String): the design doc where view is specified
 * - cb (Function): standard cb(err, result) callback
 *
 * Retrieve all keys specified in a database view.
 * These keys can then be used to retrieve database documents.
 **/
//Db.prototype.fetchIndex = function (dbName, designName, viewName, fetchSize, fetchCb, cb) {
// NOTE: fetching index in batches is troublesome because index might have duplicated keys
Db.prototype.fetchIndex = function (dbName, designName, viewName, fetchSize, fetchCb, cb) {

  console.log('[index] Fetching all index entries from view %s/%s/%s', dbName, designName, viewName);

  var db = this.nano.use(dbName),
    done = false,
    key = null,
    key_docid = null,
    interval = 0;

  function _action(cb) {

    // startkey is used, then pagination works for index with no duplicated keys
    // if index contains duplicated keys, then set fetch size to be larger than the dataset to avoid reprocessing index entry with duplicated keys
    // the smaller the fetch size, the higher the risk of encountering duplicated keys
    var opts = {
      startkey: key,
      startkey_docid: key_docid,
      limit: fetchSize + 1,
      include_docs: false
    };

    console.log('[index] Fetching index from view %s/%s/%s in batches of %d entries starting from key %s & key_docid %s',
      dbName,
      designName,
      viewName,
      fetchSize,
      opts.startkey,
      opts.startkey_docid);

    db.view(designName, viewName, opts, function (err, result) {

      if (err) {
        cb(err);

      } else {

        fetchCb(result.rows, function () {

          // when the number of retrieved documents is less than the limit, that means it's the last page
          if (result.rows.length < opts.limit) {
            done = true;
            interval = 0;
          // if not last page, then use the last document's key as the startkey of the first document on the next page
          } else {
            key = result.rows[result.rows.length - 1].key;
            key_docid = result.rows[result.rows.length - 1].id;
          }

          setTimeout(cb, interval);
        });
      }
    });
  }

  function _check() {
    return done === true;
  }

  function _end(err) {
    cb(err);
  }

  async.until(_check, _action, _end);
};

// TODO: ndoc
Db.prototype._fetch = function (createTask, keys, fetchSize, fetchCb, cb) {

  var tasks = [],
    pos = 0;

  while (pos < keys.length) {
    var size = (fetchSize < keys.length - pos) ? fetchSize : keys.length - pos;
    tasks.push(createTask(keys.slice(pos, pos + size)));
    pos += size;
  }

  async.series(tasks, cb);
};

// TODO: ndoc
Db.prototype.fetchDocsFromView = function (dbName, designName, viewName, keys, fetchSize, fetchCb, cb) {

  console.log('[docs] Fetching %d documents from view %s/%s/%s in batches of %d documents',
    keys.length,
    dbName,
    designName,
    viewName,
    fetchSize);

  var db = this.nano.use(dbName);

  function _createTask(keys) {

    return function(cb) {

      console.log('[docs] Fetching %d documents starting from key %s', keys.length, keys[0]);

      db.view(designName, viewName, { keys: keys, include_docs: true }, function (err, result) {
        if (!err) {
          fetchCb(result.rows);
        }

        // don't pass result to callback to ensure result will be garbage collected at the completion of fetchCb
        // (assuming fetchCb doesn't persist any reference to result.rows)
        cb(err);
      });
    }    
  }

  this._fetch(_createTask, keys, fetchSize, fetchCb, cb);
};

/**
 * Db#fetchDocs
 * - dbName (String): database name
 * - keys (Array): array of document keys
 * - fetchSize (Number): how many documents to fetch per request
 * - fetchCb (Function): callback function to be applied to fetched documents
 * - cb (Function): standard cb(err, result) callback
 *
 * Bulk fetch a set of documents having the specified keys.
 * Keys will be split into batches, processed in series to ensure each batch is completed before proceeding with the next one.
 * Each batch of retrieved documents will be applied to fetch callback, this is to allow data streaming in batches.
 **/
Db.prototype.fetchDocsFromDatabase = function (dbName, keys, fetchSize, fetchCb, cb) {

  console.log('[docs] Fetching %d document%s from database %s in batches of %d documents',
    keys.length,
    dbName,
    fetchSize);
  
  var db = this.nano.use(dbName);

  function _createTask(keys) {
    return function(cb) {
      console.log('[docs] Fetching %d documents starting from key %s', keys.length, keys[0]);
      db.fetch({ keys: keys }, function (err, result) {
        if (!err) {
          fetchCb(result.rows);
        }
        cb(err, result);
      });
    }    
  }

  this._fetch(_createTask, keys, fetchSize, fetchCb, cb);
};

module.exports = Db;