var fs = require('fs');

function Streamer(file) {

  this.stream = fs.createWriteStream(file, { flags: 'w', encoding: 'utf-8' });
  
  this.stream.on('error', function (err) {
    console.error('Error: %s', err.message);
  });
  this.stream.on('close', function () {
    console.log('[writer] Finish streaming file ' + file);
  });
  this.stream.on('open', function () {
    console.log('[writer] Start streaming file ' + file);
  });
}

Streamer.prototype.write = function (data) {
  this.stream.write(data);
};

Streamer.prototype.end = function () {
  this.stream.end();
};

module.exports = Streamer;