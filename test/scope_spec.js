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

  describe('$digest', function() {
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

    it('comparse based on value if enabled', function() {
      scope.aValue = [1, 2, 3];
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          return scope.counter++;
        },
        true
      )

      scope.$digest();
      expect(scope.counter).to.equal(1)

      scope.aValue.push(4)
      scope.$digest();
      expect(scope.counter).to.equal(2)
    })

    it('correctly handles NaNs', function() {
      scope.number = 0/0;
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.number; },
        function(newValue, oldValue, scope) {
          return scope.counter++;
        }
      )

      scope.$digest();
      expect(scope.counter).to.equal(1);

      scope.$digest();
      expect(scope.counter).to.equal(1)
    })
  });

  describe('$eval', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    })

    it('executes $eval\'ed function and returns result', function() {
      scope.aValue = 42;

      var result = scope.$eval(function(scope) {
        return scope.aValue;
      })

      expect(result).to.equal(42)
    })

    it('passes the second $eval argument straight through', function() {
      scope.aValue = 42;

      var result = scope.$eval(function(scope, arg) {
        return scope.aValue + arg;
      }, 2)

      expect(result).to.equal(44)
    })
  });

  describe('$apply', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    })

    it('executes $apply\'ed function and starts the digest', function() {
      scope.aValue = 'someValue'
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).to.equal(1)

      scope.$apply(function(scope) {
        scope.aValue = 'someOtherValue'
      })
      expect(scope.counter).to.equal(2)
    })
  });

  describe('$evalAsync', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    })

    it('executes $evalAsynced function later in teh same cycle', function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluated = false;
      scope.asyncEvaluatedImmediately = false;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.$evalAsync(function(scope) {
            scope.asyncEvaluated = true;
          });
          scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
        }
      );

      scope.$digest();
      expect(scope.asyncEvaluated).to.equal(true)
      expect(scope.asyncEvaluatedImmediately).to.equal(false)
    })

    it('executes $evalAsync functions added by watch functions', function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluated = false;

      scope.$watch(
        function(scope) {
          if (!scope.asyncEvaluated) {
            scope.$evalAsync(function(scope) {
              scope.asyncEvaluated = true;
            })
          }
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {}
      )

      scope.$digest();
      expect(scope.asyncEvaluated).to.equal(true)
    })

    it('executes $evalAsync functions even when not dirty', function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluatedTimes = 0;

      scope.$watch(
        function(scope) {
        if (scope.asyncEvaluatedTimes < 2) {
          scope.$evalAsync(function(scope) {
            scope.asyncEvaluatedTimes++;
          })
        }
        return scope.value;
        },
        function(newValue, oldValue, scope) {}
      );

      scope.$digest();
      expect(scope.asyncEvaluatedTimes).to.equal(2);
    })

    it('eventually halts $evalAsync added by watches', function() {
      scope.aValue = [1, 2, 3];
      scope.$watch(
        function(scope) {
          scope.$evalAsync(function(scope) {});
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {}
      );

      expect(function() { scope.$digest(); }).to.throw();
    })
  });

  describe('Scope Phases', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    })

    it('has a $$phase filed whose value is the current digest phase', function() {
      scope.aValue = [1, 2, 3];
      scope.phaseInWatchFunction = undefined;
      scope.phaseInListenerFunction = undefined;
      scope.phaseInApplyFunction = undefined;

      scope.$watch(
        function(scope) {
          scope.phaseInWatchFunction = scope.$$phase;
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          scope.phaseInListenerFunction = scope.$$phase;
        }
      )

      scope.$apply(function(scope) {
        scope.phaseInApplyFunction = scope.$$phase;
      })

      expect(scope.phaseInWatchFunction).to.equal('$digest')
      expect(scope.phaseInListenerFunction).to.equal('$digest')
      expect(scope.phaseInApplyFunction).to.equal('$apply')
    })

    it('schedules a digest in $evalAsync', function(done) {
      scope.aValue = 'abc';
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      );

      scope.$evalAsync(function(scope) {});

      expect(scope.counter).to.equal(0)
      setTimeout(function() {
        expect(scope.counter).to.equal(1);
        done();
      }, 50)
    })
  });

  describe('$applyAsync', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    })

    it('allows async $apply with $applyAsync', function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) { scope.counter++; }
      )

      scope.$digest();
      expect(scope.counter).to.equal(1)

      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      })
      expect(scope.counter).to.equal(1)

      setTimeout(function() {
        expect(scope.counter).to.equal(2);
        done();
      }, 50)
    })

    it('never executes $applyAsync\'ed function in the same cycle', function(done) {
      scope.aValue = [1, 2, 3];
      scope.asyncApplied = false;

      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.$applyAsync(function(scope) {
            scope.asyncApplied = true;
          });
        }
      )

      scope.$digest();
      expect(scope.asyncApplied).to.be.false;
      setTimeout(function() {
        expect(scope.asyncApplied).to.be.true;
        done();
      }, 50)
    })

    it('coalesces many calls to $applyAsync', function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {}
      )

      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      });
      scope.$applyAsync(function(scope) {
        scope.aValue = 'def';
      })

      setTimeout(function() {
        expect(scope.counter).to.equal(2);
        done();
      }, 50);
    })

    it('cancels and flushes $applyAsync if digested first', function(done) {
      scope.counter = 0;

      scope.$watch (
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {}
      )

      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      })
      scope.$applyAsync(function(scope) {
        scope.aValue = 'def';
      })

      scope.$digest();
      expect(scope.counter).to.equal(2)
      expect(scope.aValue).to.equal('def')

      setTimeout(function() {
        expect(scope.counter).to.equal(2)
        done();
      }, 50)
    })
  });

  describe('$$postDigest', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    })

    it('runs a $$postDigest function after each digest', function() {
      scope.counter = 0;

      scope.$$postDigest(function() {
        scope.counter++;
      })

      expect(scope.counter).to.equal(0)

      scope.$digest();
      expect(scope.counter).to.equal(1)

      scope.$digest();
      expect(scope.counter).to.equal(1)
    })

    it('does not imclue a $$postDigest in the digest', function() {
      scope.aValue = 'original value';

      scope.$$postDigest(function() {
        scope.aValue = 'changed value';
      })

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          scope.watchedValue = newValue;
        }
      )

      scope.$digest();
      expect(scope.watchedValue).to.equal('original value')

      scope.$digest();
      expect(scope.watchedValue).to.equal('changed value')
    })
  });
});
