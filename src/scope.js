/* jshint globalstrict: true */
'use strict';
var _ = require('lodash')

module.exports = Scope;

function Scope() {
  if (!(this instanceof Scope))
    return new Scope();

  this.$$watchers = [];
}

Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() {},
    last: initWatchVal
  };

  this.$$watchers.push(watcher);
}

Scope.prototype.$digest = function() {
  var self = this;
  var newValue, oldValue;

  _.forEach(this.$$watchers, function(watcher) {
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;

    if (newValue !== oldValue) {
      watcher.last = newValue;
      watcher.listenerFn(
        newValue,
        (oldValue === initWatchVal ? newValue : oldValue),
        self
      );
    }
  })
};

function initWatchVal() {}