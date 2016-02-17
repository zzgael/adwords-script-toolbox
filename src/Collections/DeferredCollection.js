/**
* Defers methods for a later use
* @constructor
* @param {AdWordsSelector} selector - Any AdWords selector
* @param {function} callback - (optional) The callback returning each item
* @param {int} logLevel - (optional) The log level
*/
this.DeferredCollection = (function () {

  var overridenMethods = {},
      baseMethods = {},
      prototype = Collection.prototype;

  _.each(_.functions(prototype),function (method) {
    baseMethods[method] = prototype[method];

    if(_.indexOf(["constructor","log","setLogLevel","push","get","set","size","getType"], method) == -1) {
      overridenMethods[method] = function () {
        throw "Collection.executeDeferred() must be called before "+method;
      }
    }
  });

  return Collection.extend( _.defaults({
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
    },
    addProperties : function (setters) {
      var self = this;

      // Loop first on setters
      // This ensure maximum performance for AdWords API calls
      _.each(setters,function (value,property) {
          var reducedOptions = {};
          reducedOptions[property] = value;
          self.$deferred.push( _.bind(self._super, self, reducedOptions));
      });

      return this;
    },
    reject : function (callback) {
      this.$deferred.push( _.bind(this._super, this, callback) );
      return this;
    }
  },overridenMethods));
})();
