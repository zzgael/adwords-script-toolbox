this.Singleton = (function () {
  var $instances = {};

  return function (instance, callback) {
    var id = instance.toString()+callback.toString();
    if(typeof $instances[id] != "undefined") {
      return $instances[id];
    }
    $instances[id] = instance();
    return callback($instances[id]);
  }
})();
