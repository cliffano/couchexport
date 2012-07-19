var bag = require('bagofholding'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  db;

describe('db', function () {

  function create(checks, mocks) {
    return sandbox.require('../lib/db', {
      requires: {},
      globals: {}
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};
  });

  describe('foo', function () {

    it('should bar', function () {
      

    });
  });
});
