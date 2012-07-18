var bag = require('bagofholding'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  formatter;

describe('formatter/csv', function () {

  function create(checks, mocks) {
    return sandbox.require('../../lib/formatter/csv', {
      requires: mocks ? mocks.requires : {},
      globals: {}
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};
  });

  describe('format', function () {

    it('should create a CSV line containing all document field values when opts is not specified', function () {
      var doc = {
        foo: 'bar',
        xyz: 'some"thing',
        hello: { world: 'ok' }
      };
      formatter = new (create(checks, mocks))();
      formatter.format(doc).should.equal('"bar","some\"thing","[object Object]"');
    });

    it('should create a CSV line containing the result of function callbacks when opts is specified', function () {
      var opts = {
          'Combo Heading': function (doc) {
            return doc.foo + doc.xyz;
          },
          childprop: function (doc) {
            return doc.hello.world;
          }
        },
        doc = {
          foo: 'bar',
          xyz: 'some"thing',
          hello: { world: 'ok' }
        };
      formatter = new (create(checks, mocks))(opts);
      formatter.format(doc).should.equal('"barsome\"thing","ok"');
    });
  });

  describe('header', function () {

    it('should create a CSV header line containing all document keys when opts is not specified', function () {
      var doc = {
        foo: 'bar',
        xyz: 'some"thing',
        hello: { world: 'ok' }
      };
      formatter = new (create(checks, mocks))();
      formatter.header(doc).should.equal('"foo","xyz","hello"');
    });

    it('should create a CSV header line containing opts keys when opts is specified', function () {
      var opts = {
          'Combo Heading': function (doc) {
            return doc.foo + doc.xyz;
          },
          childprop: function (doc) {
            return doc.hello.world;
          }
        },
        doc = {
          foo: 'bar',
          xyz: 'some"thing',
          hello: { world: 'ok' }
        };
      formatter = new (create(checks, mocks))(opts);
      formatter.header(doc).should.equal('"Combo Heading","childprop"');
    });
  });
});
