/**
* Model
* @function
* @param {object} selector - an AdWords selector or a list of items
* @param {object} options - a key/value objet defining the model
* @return {Collection} a new Singleton Collection
*/
this.Model = function (selector, options) {
    return Singleton(function () {
        return new LargeCollection(selector, options.key);
    }, function (collection) {
        if(options.props)
            collection.addProperties(options.props);

        if(options.reject)
            collection.reject(options.reject);

        if(options.relations)
            _.each(options.relations, function (relation) {
                collection.addRelationship(relation);
            });
        
        return collection;
    });
};
