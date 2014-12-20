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
    scope.aPrperty = 1;

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

      expect(sinon.called).to.be.true
    })
  });

});

