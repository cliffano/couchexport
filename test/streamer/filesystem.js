var bag = require('bagofholding'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  streamer;

describe('streamer/filesystem', function () {

  function create(checks, mocks) {
    return sandbox.require('../../lib/streamer/filesystem', {
      requires: {
        fs: bag.mock.fs(checks, mocks)
      },
      globals: {
        console: bag.mock.console(checks, mocks)
      }
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};

    mocks.fs_createWriteStream = bag.mock.stream(checks, mocks);
  });

  describe('streamer', function () {

    it('should have the correct file name and setting', function () {

      streamer = new (create(checks, mocks))('out.csv');
      checks.fs_createWriteStream_path.should.equal('out.csv');
      checks.fs_createWriteStream_opts.flags.should.equal('w');
      checks.fs_createWriteStream_opts.encoding.should.equal('utf-8');
    });

    it('should send open event', function () {

      mocks.stream_on_open = [];
      streamer = new (create(checks, mocks))('out.csv');
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('[streamer] Start streaming file out.csv');
    });
  });

  describe('write', function () {

    it('should write to the stream and log a mesage when Streamer write is called', function () {

      streamer = new (create(checks, mocks))('out.csv');
      streamer.write('someline1,someline2,someline3');
      checks.stream_write_strings.length.should.equal(1);
      checks.stream_write_strings[0].should.equal('someline1,someline2,someline3');
    });

    it('should open file stream, then log an error message when writing to the stream causes an error', function () {

      mocks.stream_on_error = [new Error('someerror')];
      streamer = new (create(checks, mocks))('out.csv');
      streamer.write('someline1,someline2,someline3');
      checks.console_error_messages.length.should.equal(1);
      checks.console_error_messages[0].should.equal('[streamer] Error: someerror');
    });
  });

  describe('end', function () {

    it('should end the stream and log a mesage when Streamer end is called', function () {
      
      mocks.stream_on_close = [];
      streamer = new (create(checks, mocks))('out.csv');
      streamer.end();
      checks.stream_end__count.should.equal(1);
      should.not.exist(checks.stream_end_string);
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('[streamer] Finish streaming file out.csv');
    });
  });
});
