/* jshint globalstrict: true */
/* global Scope: false */
'use strict';
var _      = require('lodash')
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

    it('calls the listener when watch value is first undefined', function() {
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      )

      scope.$digest();
      expect(scope.counter).to.equal(1)
    })

    it('calls listener with new value as old value the first time', function() {
      scope.someValue = 123;
      var oldValueGiven;

      scope.$watch(
        function(scope) { return scope.someValue; },
        function(newValue, oldValue, scope) { oldValueGiven = oldValue; }
      )

      scope.$digest();
      expect(oldValueGiven).to.equal(123)
    })

    it('may have watchers that omit the listener funciton', function() {
      var watchFn = sinon.spy();
      watchFn.returnValues = ['something']

      scope.$watch(watchFn)

      scope.$digest();
      expect(watchFn.called).to.be.true
    })

    it('triggers chained watchers in the same digest', function() {
      scope.name = 'Jane';

      scope.$watch(
        function(scope) { return scope.nameUpper; },
        function(newValue, oldValue, scope) {
          if (newValue)
            scope.initial = newValue.substring(0, 1) + '.';
        }
      )

      scope.$watch(
        function(scope) { return scope.name; },
        function(newValue, oldValue, scope) {
          if (newValue)
            scope.nameUpper = newValue.toUpperCase();
        }
      )

      scope.$digest();
      expect(scope.initial).to.equal('J.');

      scope.name = 'Bob';
      scope.$digest();
      expect(scope.initial).to.equal('B.')
    })

    it('gives up on the watches after 10 iterations', function() {
      scope.counterA = 0;
      scope.counterB = 0;

      scope.$watch(
        function(scope) { return scope.counterA; },
        function(newValue, oldValue, scope) {
          return scope.counterB++;
        }
      )

      scope.$watch(
        function(scope) { return scope.counterB; },
        function(newValue, oldValue, scope) {
          return scope.counterA++;
        }
      )

      expect(function() { scope.$digest() })
        .to.throw('10 digest iterations reached')
    })

    it('ends the digest when the last watch is clean', function() {
      scope.array = _.range(100)
      var watchExecutions = 0;

      _.times(100, function(i) {
        scope.$watch(
          function(scope) {
            watchExecutions++;
            return scope.array[i];
          },
          function(newValue, oldValue, scope) {}
        )
      });

      scope.$digest();
      expect(watchExecutions).to.equal(200)

      scope.array[0] = 420;
      scope.$digest();
      expect(watchExecutions).to.equal(301)
    })


    it('does not end digest so that new watches are not run', function() {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.$watch(
            function(scope) { return scope.aValue; },
            function(newValue, oldValue, scope) {
              scope.counter++;
            }
          )
        }
      )

      scope.$digest();
      expect(scope.counter).to.equal(1)
    })
  });
});
