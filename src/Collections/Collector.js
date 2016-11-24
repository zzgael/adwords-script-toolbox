/**
 * Create a new singleton of type Collection.
 * AdWords data are collected on instantiation.
 *
 * @function
 * @param {object} options - a key/value objet defining the model
 * @return {Collection} a new Singleton Collection
 */
Collector = function (options) {
    return Singleton(function () {
        var constr;
        if(options.key)
            constr =  function (item) {
                var ret = {};
                ret[options.key] = item;
                return ret;
            };
        else
            constr = options.init;

        if(options.largeDivider)
            return new LargeCollection(options.selector, constr)
                    .collectUsing(
                        options.largeDivider[0],
                        options.largeDivider[1],
                        options.largeDivider[2] || null,
                        options.largeDivider[3] || null
                    );
        else
            return new Collection(options.selector, constr);
    }, function (collection) {
        if(options.props)
            collection.addProperties(
                _.mapObject(options.props, function (prop) {
                    // Shortcut to AdWords properties getter methods
                    return _.isString(prop) ? function (item) {
                        return prop.split('.').reduce(function (entity, subProp) {
                            return entity["get"+subProp]();
                        }, item[options.key]);
                    } : prop;
                })
            );

        if(options.reject)
            collection.reject(options.reject);

        if(options.methods)
            collection.addMethods(options.methods);

        if(options.relations) {
            _.each(options.relations, function (relation) {
                collection.addRelationship.apply(collection, relation);
            });
        }

        if(options.assertions)
            _.each(options.assertions, test, collection);

        return collection;
    }, options);
};
