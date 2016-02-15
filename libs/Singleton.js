this.Singleton = (function () {
  var $instances = [];

  return function (classObj,callback) {
    var id = classObj+callback.toString();
    if($instances[id]) {
      return $instances[id];
    }
    $instances[id] = callback(classObj);

    return $instances[id];
  }
})();
