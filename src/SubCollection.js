/**
* SubCollection defers all of its methods for a later use by Collection
* @constructor
* @param {AdWordsSelector} selector - Any AdWords selector
* @param {function} callback - (optional) The callback returning each item
* @param {int} logLevel - (optional) The log level
*/
this.SubCollection = (function () {
  return Collection.extend({
    init : function () {
      this.$properties = {};
      this.$rejectFilters = [];

      return _super.apply(this, arguments);
    },
})();
