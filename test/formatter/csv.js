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

    it('should create a CSV line containing the result of decorator functions as the values', function () {
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
          xyz: 'something',
          hello: { world: 'ok' }
        };
      formatter = new (create(checks, mocks))(opts);
      formatter.format(doc).should.equal('"barsomething","ok"\n');
    });

    it('should escape double quote in column value', function () {
      var opts = {
          'Combo Heading': function (doc) {
            return doc.foo + doc.xyz;
          },
          childprop: function (doc) {
            return doc.hello.world;
          }
        },
        doc = {
          foo: 'bar"',
          xyz: 'some""thing',
          hello: { world: '"ok' }
        };
      formatter = new (create(checks, mocks))(opts);
      formatter.format(doc).should.equal('"bar""some""""thing","""ok"\n');
    });
  });

  describe('header', function () {

    it('should create a CSV header line containing opts keys', function () {
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
      formatter.header(doc).should.equal('"Combo Heading","childprop"\n');
    });

    it('should escape double quote in heading value', function () {
      var opts = {
          'Combo "Heading': function (doc) {
            return doc.foo + doc.xyz;
          },
          'childprop"': function (doc) {
            return doc.hello.world;
          }
        },
        doc = {
          foo: 'bar',
          xyz: 'some"thing',
          hello: { world: 'ok' }
        };
      formatter = new (create(checks, mocks))(opts);
      formatter.header(doc).should.equal('"Combo ""Heading","childprop"""\n');
    });
  });
});
