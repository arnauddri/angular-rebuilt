/* jshint globalstrict: true */
/* global Scope: false */
'use strict';
var chai   = require('chai');
var sinon  = require('sinon');
var expect = chai.expect;

var Scope = require('./../src/scope.js');

describe('Scope', function() {

  it('can be constructed as an object', function() {
    var scope = new Scope();
    scope.aProperty = 1;

    expect(scope.aProperty).to.equal(1)
  })

  describe('digest', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    })

    it('calls the listener function of a watch on first $digest', function() {
      var watchFn = function() { return 'wat'; }
      var listenerFn = sinon.spy();
      scope.$watch(watchFn, listenerFn);

      scope.$digest();

      expect(listenerFn.called).to.be.true
    })

    it('calls the watch function with the scope as the argument', function() {
      var watchFn = sinon.spy();
      var listenerFn = function() {};
      scope.$watch(watchFn, listenerFn);

      scope.$digest();

      expect(watchFn.called).to.be.true
    })

    it('calls the listener function when the watched value cahnges', function() {
      scope.someValue = 'a';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      )

      expect(scope.counter).to.equal(0)

      scope.$digest();
      expect(scope.counter).to.equal(1)

      scope.$digest();
      expect(scope.counter).to.equal(1)

      scope.someValue = 'b';
      expect(scope.counter).to.equal(1)

      scope.$digest();
      expect(scope.counter).to.equal(2)
    })
  });

});

