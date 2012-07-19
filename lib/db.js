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

/**
 * Db#fetchIndex
 * - dbName (String): database name
 * - designName (String): the design document where view is specified
 * - viewName (String): view name within the design document
 * - fetchSize (Number): how many rows to fetch per batch
 * - fetchCb (Function): callback function fetchCb(rows), which will be passed fetched result rows, rows (instead of docs within the rows) are returned here to avoid additional result traversal 
 * - cb (Function): standard cb(err, result) callback, will be called when index fetching has been completed
 *
 * Retrieve the complete set of index in batches, to allow better control of memory usage.
 * If the client needs to process the whole index in one go (e.g. to remove duplicated key or value), then fetchSize should be set to a value larger than the number of rows in CouchDB view index.
 * The retrieved index entries on each batch will be passed to fetchCb.
 **/
Db.prototype.fetchIndex = function (dbName, designName, viewName, fetchSize, fetchCb, cb) {

  console.log('[index] Fetching all index entries from view %s/%s/%s', dbName, designName, viewName);

  var db = this.nano.use(dbName),
    done = false,
    key = null,
    key_docid = null,
    interval = 0;

  function _action(cb) {

    // if startkey is used, then pagination works for index with no duplicated keys
    // if index contains duplicated keys, then CouchDB will fall back to startkey_docid
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

          // when the number of retrieved documents is less than the limit, that means it's the last batch
          if (result.rows.length < opts.limit) {
            done = true;
            interval = 0;
          // if not last batch, then use the last document's key & id as the startkey & startkey_docid of the first document on the next page
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

/** internal
 * Db#_fetch
 * - createTask (Function): task creation function
 * - keys (Array): each key will be wrapped in a task function
 * - fetchSize (Number): how many keys will be used to retrieve documents in a task, used to determine position range within the whole keys array
 * - cb (Function): standard cb(err, result) callback, will be called at the end of 
 *
 * Create tasks for the specified keys, and execute them in order (series).
 **/
Db.prototype._fetch = function (createTask, keys, fetchSize, cb) {

  var tasks = [],
    pos = 0;

  while (pos < keys.length) {
    var size = (fetchSize < keys.length - pos) ? fetchSize : keys.length - pos;
    tasks.push(createTask(keys.slice(pos, pos + size)));
    pos += size;
  }

  async.series(tasks, cb);
};

/**
 * Db#fetchDocsFromView
 * - dbName (String): database name
 * - designName (String): the design document where view is specified
 * - viewName (String): view name within the design document
 * - keys (Array): an array of document keys to retrieve
 * - fetchSize (Number): how many rows to fetch per batch
 * - fetchCb (Function): callback function fetchCb(rows), which will be passed fetched result rows, rows (instead of docs within the rows) are returned here to avoid additional result traversal 
 * - cb (Function): standard cb(err, result) callback, will be called when document fetching has been completed
 *
 * Retrieve the documents based on the provided keys in batches, to allow better control of memory usage.
 * Documents are retrieved via the view, using include_docs: true.
 * The retrieved documents on each batch will be passed to fetchCb.
 **/
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

  this._fetch(_createTask, keys, fetchSize, cb);
};

/**
 * Db#fetchDocsFromDatabase
 * - dbName (String): database name
 * - keys (Array): an array of document keys to retrieve
 * - fetchSize (Number): how many rows to fetch per batch
 * - fetchCb (Function): callback function fetchCb(rows), which will be passed fetched result rows, rows (instead of docs within the rows) are returned here to avoid additional result traversal 
 * - cb (Function): standard cb(err, result) callback, will be called when document fetching has been completed
 *
 * Retrieve the documents based on the provided keys in batches, to allow better control of memory usage.
 * Documents are retrieved directly from the database.
 * The retrieved documents on each batch will be passed to fetchCb.
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

        // don't pass result to callback to ensure result will be garbage collected at the completion of fetchCb
        // (assuming fetchCb doesn't persist any reference to result.rows)
        cb(err);
      });
    }    
  }

  this._fetch(_createTask, keys, fetchSize, cb);
};

module.exports = Db;