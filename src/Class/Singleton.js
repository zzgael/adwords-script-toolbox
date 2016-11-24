this.Singleton = (function () {
    var $instances = {};

    return function (instance, callback, options) {
        var id = instance.toString() + (_.isFunction(callback)
                ? callback.toString() : "") + JSON.stringify(options);
        if (typeof $instances[id] != "undefined") {
            return $instances[id];
        }
        $instances[id] = instance();
        return _.isFunction(callback) ? callback($instances[id]) : $instances[id];
    }
})();
