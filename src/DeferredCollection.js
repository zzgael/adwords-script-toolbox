/**
* Defers methods for a later use by a parent Collection
* @constructor
* @param {AdWordsSelector} selector - Any AdWords selector
* @param {function} callback - (optional) The callback returning each item
* @param {int} logLevel - (optional) The log level
*/
this.DeferredCollection = (function () {

  var deferredMethods = ['addProperties','reject'],
      overridenMethods = {},
      baseMethods = {};

  _.functions(Collection,function (method) {
    baseMethods[method] = Collection.method;
    overridenMethods[method] = function () {
      if(_.indexOf(deferredMethods, method)) {
        this.$deferred.push( _.bind(this._super, this, arguments) );
        return this;
      }
      else
        throw "Collection.executeDeferred() must be called before "+method;
    }
  });

  return Collection.extend( _.extend(overridenMethods, {
    init : function () {
      this.$deferred = [];

      return this._super.apply(this, arguments);
    },
    hasDefer : function () {
      return _.size(this.$deferred);
    },
    unpileDeferred : function () {
      var self = this;

      self.$deferred.shift()();

      // All your defers are unpiled to us
      if(!_.size(self.$deferred)) {
        _.extend(self,baseMethods);
      }

      return self;
    }
  }));
})();
