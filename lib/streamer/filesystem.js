var fs = require('fs');

/**
 * class Streamer
 * - file (String): name of the file which data will be streamed to
 **/
function Streamer(file) {

  this.stream = fs.createWriteStream(file, { flags: 'w', encoding: 'utf-8' });
  
  this.stream.on('error', function (err) {
    console.error('[streamer] Error: %s', err.message);
  });
  this.stream.on('close', function () {
    console.log('[streamer] Finish streaming file %s', file);
  });
  this.stream.on('open', function () {
    console.log('[streamer] Start streaming file %s', file);
  });
}

/**
 * Streamer#write
 * - data (String): data to stream to the file
 *
 * Stream data to the file.
 **/
Streamer.prototype.write = function (data) {
  this.stream.write(data);
};

/**
 * Streamer#end
 *
 * Finish data streaming.
 **/
Streamer.prototype.end = function () {
  this.stream.end();
};

module.exports = Streamer;